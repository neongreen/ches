/** Everything related to how the bishop moves. */

import { Board } from '@/board'
import { Move } from '@/move'
import { pieceColor } from '@/piece'
import { Coord } from '@/utils/coord'

/**
 * Squares that a bishop passes between points A and B (not including either of those).
 */
export function bishopPath(a: Coord, b: Coord): Coord[] | undefined {
  if (a.x - a.y === b.x - b.y || a.x + a.y === b.x + b.y) {
    return a.pathTo(b, 'exclusive')
  } else {
    return undefined
  }
}

/**
 * All possible bishop moves on the board, including captures.
 */
export function bishopMoves(board: Board, coord: Coord): Move[] {
  let moves: Move[] = []
  const piece = board.at(coord)
  const deltas = [
    { x: 1, y: 1 },
    { x: -1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: -1 },
  ]
  for (let delta of deltas) {
    let xy = coord.shift(delta)
    while (board.isEmpty(xy)) {
      moves.push({ kind: 'normal', from: coord, to: xy })
      xy = xy.shift(delta)
    }
    if (board.isOccupied(xy) && pieceColor(board.at(xy)) !== pieceColor(piece)) {
      moves.push({ kind: 'normal', from: coord, to: xy })
    }
  }
  return moves
}

/**
 * Is a bishop move valid? (Does not take checks into account.)
 */
export function isBishopMoveValid(board: Board, move: Move): boolean {
  if (move.kind !== 'normal') return false
  const path = bishopPath(move.from, move.to)
  return (
    path !== undefined &&
    path.every((coord) => board.isEmpty(coord)) &&
    (board.isEmpty(move.to) || pieceColor(board.at(move.from)) !== pieceColor(board.at(move.to)))
  )
}
