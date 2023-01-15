/**
 * Export sample games to a folder.
 *
 * Lets us check that the logic didn't change during a refactor.
 */

import { Board } from '@/board'
import { Search } from '@/eval/search'
import { EvalNode } from '@/eval/node'
import { notateMove } from '@/move'
import { writeFileSync } from 'fs'
import path from 'path'
import { renderScore, Score } from '@/eval/score'

for (let depth = 1; depth <= 5; depth++) {
  const filename = path.resolve(__dirname, `sample-games/depth-${depth}.txt`)
  const board = new Board()
  const game: [Score, string][] = []
  const search = new Search()
  while (true) {
    const best = search.findBestMove(new EvalNode(board), depth)
    if (best.move === null) {
      game.push([best.score, best.score === 0 ? '1/2-1/2' : best.score > 0 ? '1-0' : '0-1'])
      break
    } else {
      game.push([best.score, notateMove(board, best.move)])
      board.executeMove(best.move)
    }
  }
  writeFileSync(filename, game.map(([score, move]) => `${move} ${renderScore(score)}`).join('\n'))
}
