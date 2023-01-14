/** Everything related to how the queen moves. */

import { Board } from '@/board'
import { Move } from '@/move'
import { Color, pieceColor } from '@/piece'
import { Coord } from '@/utils/coord'
import { bishopMoves, bishopPath } from './bishop'
import { rookMoves, rookPath } from './rook'

/**
 * Squares that a queen passes between points A and B (not including either of those).
 */
export function queenPath(a: Coord, b: Coord): Coord[] | undefined {
  if (a.x === b.x || a.y === b.y) {
    return rookPath(a, b)
  } else if (a.x - a.y === b.x - b.y || a.x + a.y === b.x + b.y) {
    return bishopPath(a, b)
  } else {
    return undefined
  }
}

/**
 * All possible queen moves on the board, including captures.
 */
export function queenMoves(board: Board, color: Color, coord: Coord): Move[] {
  return [...rookMoves(board, color, coord), ...bishopMoves(board, color, coord)]
}

/**
 * Is a queen move valid? (Does not take checks into account.)
 */
export function isQueenMoveValid(board: Board, move: Move): boolean {
  if (move.kind !== 'normal') return false
  const path = queenPath(move.from, move.to)
  return (
    path !== undefined &&
    path.every((coord) => board.isEmpty(coord)) &&
    (board.isEmpty(move.to) || pieceColor(board.at(move.from)) !== pieceColor(board.at(move.to)))
  )
}
