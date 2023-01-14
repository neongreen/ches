/** Everything related to how the bishop moves. */

import { Board } from '@/board'
import { Move } from '@/move'
import { Color, Piece, pieceColor } from '@/piece'
import { Coord } from '@/utils/coord'

/**
 * All possible bishop moves on the board, including captures.
 */
export function bishopMoves(board: Board, color: Color, coord: Coord): Move[] {
  let moves: Move[] = []
  const deltas = [
    { x: 1, y: 1 },
    { x: -1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: -1 },
  ]
  for (const delta of deltas) {
    let xy = coord.shift(delta)
    while (board.isEmpty(xy)) {
      moves.push({ kind: 'normal', from: coord, to: xy })
      xy = xy.shift(delta)
    }
    if (board.isOccupied(xy) && pieceColor(board.at(xy)) !== color) {
      moves.push({ kind: 'normal', from: coord, to: xy })
    }
  }
  return moves
}
