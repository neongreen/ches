/** Everything related to how the knight moves. */

import { Board } from '@/board'
import { Move } from '@/move'
import { Color, Piece, pieceColor } from '@/piece'
import { Coord } from '@/utils/coord'
import _ from 'lodash'

/**
 * All possible knight moves on the board, including captures.
 */
export function knightMoves(board: Board, color: Color, coord: Coord): Move[] {
  let moves: Move[] = []
  const deltas = [
    { x: 1, y: 2 },
    { x: 2, y: 1 },
    { x: -1, y: 2 },
    { x: -2, y: 1 },
    { x: 1, y: -2 },
    { x: 2, y: -1 },
    { x: -1, y: -2 },
    { x: -2, y: -1 },
  ]
  for (let delta of deltas) {
    const target = coord.shift(delta)
    if (target.isValid() && pieceColor(board.at(target)) !== color) {
      moves.push({ kind: 'normal', from: coord, to: target })
    }
  }
  return moves
}
