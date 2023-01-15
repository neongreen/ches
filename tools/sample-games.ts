/**
 * Export sample games to a folder.
 *
 * Lets us check that the logic didn't change during a refactor.
 */

import { Board } from '@/board'
import { findBestMove } from '@/eval/eval'
import { EvalNode } from '@/eval/node'
import { notateMove } from '@/move'
import { writeFileSync } from 'fs'
import path from 'path'

for (let depth = 1; depth <= 4; depth++) {
  const filename = path.resolve(__dirname, `sample-games/depth-${depth}.txt`)
  const board = new Board()
  const game = []
  while (true) {
    const best = findBestMove(new EvalNode(board), depth)
    if (best.move === null) {
      if (best.score === 0) {
        game.push('1/2-1/2')
      } else if (best.score > 0) {
        game.push('1-0')
      } else {
        game.push('0-1')
      }
      break
    } else {
      game.push(notateMove(board, best.move))
      board.executeMove(best.move)
    }
  }
  writeFileSync(filename, game.join(' '))
}
