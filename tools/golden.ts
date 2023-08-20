/**
 * Export sample games to a folder.
 *
 * Lets us check that the logic (of the engine *and* the challenges) didn't change during a refactor.
 */

import { Board } from '@/board'
import { Search } from '@/eval/search'
import { EvalNode } from '@/eval/node'
import { Move, notateMove } from '@/move'
import { mkdirSync, writeFileSync, rmSync } from 'fs'
import path from 'path'
import { renderScore, Score } from '@/eval/score'
import { Color } from '@/piece'
import { challengesMap } from '@/challenges/all'
import { legalMoves_slow } from '@/move/legal'
import _ from 'lodash'
import { parseArgs } from 'node:util'
import { P, match } from 'ts-pattern'

const args = parseArgs({
  args: process.argv.slice(2),
  options: {
    scenario: {
      type: 'string',
      short: 's',
      multiple: true,
      description:
        'Which scenario to generate a sample game for. Can specify multiple scenarios by providing the flag several times. If not specified, all scenarios are generated.',
    },
  },
})

const scenarios = [
  {
    id: 'unrestricted',
    create: () => ({
      isMoveAllowed: () => true,
      isChallengeLost: () => ({ lost: false }),
      recordMove: () => {
        return
      },
    }),
  },
  ...Array.from(challengesMap.values()).map(({ meta, create }) => ({ id: meta.uuid, create })),
].filter((scenario) => !args.values.scenario || args.values.scenario.includes(scenario.id))

// Clear relevant folders, or the whole golden-games folder if no scenarios were specified.
if (!args.values.scenario?.length) {
  rmSync(path.resolve(process.cwd(), 'golden-games'), { recursive: true, force: true })
} else {
  for (const id of args.values.scenario)
    rmSync(path.resolve(process.cwd(), `golden-games/${id}`), { recursive: true, force: true })
}

for (const scenario of scenarios) {
  const id = scenario.id
  const challenge = scenario.create()
  console.debug(`Generating sample games for ${id}`)
  for (let depth = 1; depth <= 4; depth++) {
    console.debug(`  - depth ${depth}`)
    const filename = path.resolve(process.cwd(), `golden-games/${id}/depth-${depth}.txt`)
    mkdirSync(path.dirname(filename), { recursive: true })
    const board = new Board()
    const game: ({ boardBeforeMove: Board; move: Move; score: Score } | { result: string })[] = []
    const history: { boardBeforeMove: Board; move: Move }[] = []
    const search = new Search()
    while (true) {
      const currentFullMoveNumber = Math.floor(history.length / 2) + 1
      const currentHalfMoveNumber = history.length + 1
      // We need to find the best move, keeping in mind that white always does a challenge, but black can do anything.
      let best: { move: Move | null; score: Score; legalMoveExistsButForbidden?: true }
      // FIXME: gives different results compared to just using 'false' here. See https://github.com/neongreen/ches/issues/4.
      if (board.side === Color.White) {
        const eval0 = search.evaluateDepth0(new EvalNode(board))
        if (eval0.move === null) {
          // The game has ended
          best = { move: null, score: eval0.score }
        } else {
          // The game is still going; since `search` can't rank moves,  we have to generate all possible legal moves allowed by the challenge, and ask for their eval.
          const decider = (() => {
            const obj = { currentFullMoveNumber, currentHalfMoveNumber, history, board }
            return (move: Move) => challenge.isMoveAllowed({ ...obj, move }) ?? true
          })()
          const moves = legalMoves_slow(board)
            .filter(decider)
            .map((move) => ({
              move,
              score: search.evaluateMove(board, move, depth),
            }))
          // Note that here it's possible that we'll end the game even though it's not a checkmate or a draw, because the challenge might restrict us from making any moves. This will result in writing something like "0-1 -8.64" to the file. Which is fine.
          best = _.maxBy(moves, 'score') ?? {
            move: null,
            score: eval0.score,
            legalMoveExistsButForbidden: true,
          }
        }
      } else {
        best = search.findBestMove(new EvalNode(board), depth)
      }
      // Now that we've found the best move (or null, meaning game over), we can proceed.
      if (challenge?.isChallengeLost?.({ board }).lost ?? false) {
        game.push({ result: 'Challenge lost - explicitly' })
        break
      } else if (best.move === null) {
        game.push({
          result: match(best)
            .with(
              { legalMoveExistsButForbidden: true },
              () => 'Challenge lost - no moves available'
            )
            .with({ score: 0 }, () => '1-2/1-2')
            .otherwise(() => (best.score > 0 ? '1-0' : '0-1')),
        })
        break
      } else {
        const boardBeforeMove = board.clone()
        const move = best.move
        game.push({ move, boardBeforeMove, score: best.score })
        board.executeMove(move)
        history.push({ boardBeforeMove, move })
        challenge.recordMove?.({ move, boardBeforeMove, boardAfterMove: board })
      }
    }
    writeFileSync(
      filename,
      game
        .map((line, i) =>
          match(line)
            .with({ result: P._ }, ({ result }) => result)
            .with({ move: P._ }, ({ boardBeforeMove, move, score }) => {
              const n = i % 2 === 0 ? `${Math.floor((i + 1) / 2) + 1}.` : '...'
              return `${n} ${notateMove(boardBeforeMove, move)} ${renderScore(score)}`
            })
            .exhaustive()
        )
        .join('\n')
    )
  }
}
