/** Everything related to how the king moves. */

import { Board } from '@/board'
import { Move } from '@/move'
import { pieceColor } from '@/piece'
import { Coord } from '@/utils/coord'
import _ from 'lodash'

/**
 * All possible king moves on the board, including captures.
 *
 * TODO: castling
 */
export function kingMoves(board: Board, coord: Coord): Move[] {
  let moves: Move[] = []
  const piece = board.at(coord)
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      if (x === 0 && y === 0) continue
      const target = coord.shift({ x, y })
      if (
        target.isValid() &&
        pieceColor(board.at(target)) !== pieceColor(piece)
      ) {
        moves.push({ kind: 'normal', from: coord, to: target })
      }
    }
  }
  return moves
}

/**
 * Is a king move valid? (Does not take checks into account.)
 */
export function isKingMoveValid(board: Board, move: Move) {
  return kingMoves(board, move.from).some((m) => _.isEqual(m, move))
}
