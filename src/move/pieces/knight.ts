/** Everything related to how the knight moves. */

import { Board } from '@/board'
import { Move } from '@/move'
import { pieceColor } from '@/piece'
import { Coord } from '@/utils/coord'
import _ from 'lodash'

/**
 * All possible knight moves on the board, including captures.
 */
export function knightMoves(board: Board, coord: Coord): Move[] {
  let moves: Move[] = []
  const piece = board.at(coord)
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
    if (target.isValid() && pieceColor(board.at(target)) !== pieceColor(piece)) {
      moves.push({ kind: 'normal', from: coord, to: target })
    }
  }
  return moves
}

/**
 * Is a knight move valid? (Does not take checks into account.)
 */
export function isKnightMoveValid(board: Board, move: Move) {
  if (move.kind !== 'normal') return false
  return knightMoves(board, move.from).some((m) => _.isEqual(m, move))
}
