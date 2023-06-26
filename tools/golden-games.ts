/**
 * Export sample games to a folder.
 *
 * Lets us check that the logic (of the engine *and* the challenges) didn't change during a refactor.
 */

import { Board } from '@/board'
import { Search } from '@/eval/search'
import { EvalNode } from '@/eval/node'
import { Move, notateMove } from '@/move'
import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import { renderScore, Score } from '@/eval/score'
import { Color } from '@/piece'
import { challenges } from '@/challenges/all'
import { legalMoves_slow } from '@/move/legal'
import _ from 'lodash'

const scenarios = [
  { id: 'unrestricted', isMoveAllowed: () => true },
  ...challenges.flatMap(({ list }) =>
    list.map(({ uuid, isMoveAllowed }) => ({ id: uuid, isMoveAllowed }))
  ),
]

for (const scenario of scenarios) {
  const id = scenario.id
  for (let depth = 1; depth <= 4; depth++) {
    console.debug(`Generating a sample game for ${id}, depth ${depth}`)
    const filename = path.resolve(__dirname, `golden-games/${id}/depth-${depth}.txt`)
    mkdirSync(path.dirname(filename), { recursive: true })
    const board = new Board()
    const game: [Score, string][] = []
    const history: { boardBeforeMove: Board; move: Move }[] = []
    const search = new Search()
    while (true) {
      const currentFullMoveNumber = Math.floor(game.length / 2) + 1
      const currentHalfMoveNumber = game.length + 1
      // We need to find the best move, keeping in mind that white always does a challenge, but black can do anything.
      let best
      // FIXME: gives different results compared to just using 'false' here. See https://github.com/neongreen/ches/issues/4.
      if (board.side === Color.White) {
        const decider = (() => {
          const obj = { currentFullMoveNumber, currentHalfMoveNumber, history, board }
          return (move: Move) => scenario.isMoveAllowed({ ...obj, move }) ?? true
        })()
        // `search` can't rank moves, so we generate all moves and ask for their eval.
        const moves = legalMoves_slow(board)
          .filter(decider)
          .map((move) => ({
            move,
            score: search.evaluateMove(board, move, depth),
          }))
        best = _.maxBy(moves, 'score') ?? { move: null, score: search.evaluateBoard(board, 0) }
      } else {
        best = search.findBestMove(new EvalNode(board), depth)
      }
      // Now that we've found the best move (or null, meaning game over), we can proceed.
      if (best.move === null) {
        game.push([best.score, best.score === 0 ? '1/2-1/2' : best.score > 0 ? '1-0' : '0-1'])
        break
      } else {
        const notation =
          board.side === Color.White
            ? `${currentFullMoveNumber}. ${notateMove(board, best.move)}`
            : `... ${notateMove(board, best.move)}`
        game.push([best.score, notation])
        board.executeMove(best.move)
      }
    }
    writeFileSync(filename, game.map(([score, move]) => `${move} ${renderScore(score)}`).join('\n'))
  }
}
