/** Everything related to how the pawn moves. */

import { Board } from '@/board'
import { Move } from '@/move'
import { Color, Piece, pieceColor } from '@/piece'
import { Coord } from '@/utils/coord'
import _ from 'lodash'

/**
 * All possible pawn moves on the board, including captures.
 *
 * TODO: en passant, promotion to pieces other than queen
 */
export function pawnMoves(board: Board, coord: Coord): Move[] {
  const piece = board.at(coord)
  let moves: Move[] = []

  if (piece === Piece.WhitePawn) {
    // going up 1 if empty
    {
      const dest = coord.n()
      if (board.isEmpty(dest))
        moves.push({
          kind: 'normal',
          from: coord,
          to: dest,
          ...(dest.y === 7 ? { promotion: Piece.WhiteQueen } : {}),
        })
    }

    // going up 2 if empty && we are on the second rank
    if (
      coord.y === 1 &&
      board.isEmpty(coord.n()) &&
      board.isEmpty(coord.n().n())
    ) {
      moves.push({ kind: 'normal', from: coord, to: coord.n().n() })
    }

    // captures if there's something to capture
    for (const dest of [coord.ne(), coord.nw()]) {
      if (board.isOccupied(dest) && pieceColor(board.at(dest)) === Color.Black)
        moves.push({
          kind: 'normal',
          from: coord,
          to: dest,
          ...(dest.y === 7 ? { promotion: Piece.WhiteQueen } : {}),
        })
    }
  }

  if (piece === Piece.BlackPawn) {
    // going down 1 if empty
    {
      const dest = coord.s()
      if (board.isEmpty(dest))
        moves.push({
          kind: 'normal',
          from: coord,
          to: dest,
          ...(dest.y === 0 ? { promotion: Piece.BlackQueen } : {}),
        })
    }

    // going down 2 if empty && we are on the seventh rank
    if (
      coord.y === 6 &&
      board.isEmpty(coord.s()) &&
      board.isEmpty(coord.s().s())
    ) {
      moves.push({ kind: 'normal', from: coord, to: coord.s().s() })
    }

    // captures if there's something to capture
    for (const dest of [coord.se(), coord.sw()]) {
      if (board.isOccupied(dest) && pieceColor(board.at(dest)) === Color.White)
        moves.push({
          kind: 'normal',
          from: coord,
          to: dest,
          ...(dest.y === 0 ? { promotion: Piece.BlackQueen } : {}),
        })
    }
  }
  return moves
}

/**
 * Is a pawn move valid? (Does not take checks into account.)
 */
export function isPawnMoveValid(board: Board, move: Move): boolean {
  return pawnMoves(board, move.from).some((m) => _.isEqual(m, move))
}
