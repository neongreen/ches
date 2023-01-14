/** Everything related to how the rook moves. */

import { Board } from '@/board'
import { Move } from '@/move'
import { Color, Piece, pieceColor } from '@/piece'
import { Coord } from '@/utils/coord'

/**
 * Squares that a rook passes between points A and B (not including either of those).
 */
export function rookPath(a: Coord, b: Coord): Coord[] | undefined {
  if (a.x === b.x || a.y === b.y) return a.pathTo(b, 'exclusive')
  else return undefined
}

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
    if (board.isOccupied(xy) && pieceColor(board.at(xy)) !== color) {
      moves.push({ kind: 'normal', from: coord, to: xy })
    }
  }
  return moves
}

/**
 * Is a rook move valid? (Does not take checks into account.)
 */
export function isRookMoveValid(board: Board, move: Move): boolean {
  if (move.kind !== 'normal') return false
  const path = rookPath(move.from, move.to)
  return (
    path !== undefined &&
    path.every((coord) => board.isEmpty(coord)) &&
    (board.isEmpty(move.to) || pieceColor(board.at(move.from)) !== pieceColor(board.at(move.to)))
  )
}
