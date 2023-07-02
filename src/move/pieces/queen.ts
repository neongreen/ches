/** Everything related to how the queen moves. */

import { Board } from '@/board'
import { Move } from '@/move'
import { Color } from '@/piece'
import { Coord } from '@/utils/coord'
import { bishopMoves } from './bishop'
import { rookMoves } from './rook'

/**
 * All possible queen moves on the board, including captures.
 */
export function queenMoves(board: Board, color: Color, coord: Coord): Move[] {
  return [...rookMoves(board, color, coord), ...bishopMoves(board, color, coord)]
}
