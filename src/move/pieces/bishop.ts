/** Everything related to how the bishop moves. */

import { Board } from '@/board'
import { Move } from '@/move'
import { Color, MaybePiece, PieceEmpty, invertColor, pieceColor } from '@/piece'
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
      moves.push({ kind: 'normal', from: coord, to: xy, promotion: null, capture: PieceEmpty })
      xy = xy.shift(delta)
    }
    const target = board.at(xy)
    if (pieceColor(target) === invertColor(color)) {
      moves.push({ kind: 'normal', from: coord, to: xy, promotion: null, capture: target })
    }
  }
  return moves
}
