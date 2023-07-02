/** Everything related to how the rook moves. */

import { Board } from '@/board'
import { Move } from '@/move'
import { Color, MaybePiece, invertColor, pieceColor } from '@/piece'
import { Coord } from '@/utils/coord'

/**
 * All possible rook moves on the board, including captures.
 */
export function rookMoves(board: Board, color: Color, coord: Coord): Move[] {
  let moves: Move[] = []
  const deltas = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ]
  for (let delta of deltas) {
    let xy = coord.shift(delta)
    while (board.isEmpty(xy)) {
      moves.push({ kind: 'normal', from: coord, to: xy })
      xy = xy.shift(delta)
    }
    if (pieceColor(board.at(xy)) === invertColor(color)) {
      moves.push({ kind: 'normal', from: coord, to: xy })
    }
  }
  return moves
}
