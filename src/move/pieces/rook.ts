/** Everything related to how the rook moves. */

import { Board } from '@/board'
import { Move } from '@/move'
import { pieceColor } from '@/piece'
import { Coord, squaresBetween } from '@/utils/coord'

/**
 * Squares that a rook passes between points A and B (not including either of those).
 */
export function rookPath(a: Coord, b: Coord): Coord[] | undefined {
  if (a.x === b.x) {
    return squaresBetween(a, b, { x: 0, y: a.y < b.y ? 1 : -1 })
  } else if (a.y === b.y) {
    return squaresBetween(a, b, { x: a.x < b.x ? 1 : -1, y: 0 })
  } else {
    return undefined
  }
}

/**
 * All possible rook moves on the board, including captures.
 */
export function rookMoves(board: Board, coord: Coord): Move[] {
  let moves: Move[] = []
  const piece = board.at(coord)
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
    if (
      board.isOccupied(xy) &&
      pieceColor(board.at(xy)) !== pieceColor(piece)
    ) {
      moves.push({ kind: 'normal', from: coord, to: xy })
    }
  }
  return moves
}

/**
 * Is a rook move valid? (Does not take checks into account.)
 */
export function isRookMoveValid(board: Board, move: Move): boolean {
  const path = rookPath(move.from, move.to)
  return (
    path !== undefined &&
    path.every((coord) => board.isEmpty(coord)) &&
    (board.isEmpty(move.to) ||
      pieceColor(board.at(move.from)) !== pieceColor(board.at(move.to)))
  )
}
