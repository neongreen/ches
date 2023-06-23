/** Everything related to how the pawn moves. */

import { Board } from '@/board'
import { Move } from '@/move'
import { Color, Piece, pieceColor } from '@/piece'
import { Coord } from '@/utils/coord'
import _ from 'lodash'

/**
 * All possible pawn moves on the board, including captures.
 *
 * TODO: promotion to pieces other than queen
 */
export function pawnMoves(board: Board, color: Color, coord: Coord): Move[] {
  let moves: Move[] = []

  if (color === Color.White) {
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
    if (coord.y === 1 && board.isEmpty(coord.n()) && board.isEmpty(coord.n().n())) {
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

    // en passant, if possible
    if (board.enPassantTargetSquare) {
      const dest = board.enPassantTargetSquare
      //
      //          [en passant]
      //   (x)    [black pawn]    (x)
      //
      // En passant is possible if we are at (x). We don't need to check anything else - the en passant square is guaranteed to be empty, and the pawn is guaranteed to be present and of the opposite color.
      if (coord.ne().equals(dest) || coord.nw().equals(dest)) {
        moves.push({
          kind: 'enPassant',
          from: coord,
          to: dest,
        })
      }
    }
  } else {
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
    if (coord.y === 6 && board.isEmpty(coord.s()) && board.isEmpty(coord.s().s())) {
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

    // en passant, if possible
    if (board.enPassantTargetSquare) {
      const dest = board.enPassantTargetSquare
      //
      //   (x)    [white pawn]    (x)
      //          [en passant]
      //
      // En passant is possible if we are at (x).
      if (coord.se().equals(dest) || coord.sw().equals(dest)) {
        moves.push({
          kind: 'enPassant',
          from: coord,
          to: dest,
        })
      }
    }
  }
  return moves
}
