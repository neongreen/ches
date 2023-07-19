/** Everything related to how the pawn moves. */

import { Board } from '@/board'
import { Move } from '@/move'
import {
  Color,
  MaybePiece,
  Piece,
  PieceEmpty,
  isBlackPiece,
  isWhitePiece,
  pieceColor,
} from '@/piece'
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
          promotion: dest.y === 7 ? Piece.WhiteQueen : null,
          capture: PieceEmpty,
        })
    }

    // going up 2 if empty && we are on the second rank
    if (coord.y === 1 && board.isEmpty(coord.n()) && board.isEmpty(coord.n().n())) {
      moves.push({
        kind: 'normal',
        from: coord,
        to: coord.n().n(),
        promotion: null,
        capture: PieceEmpty,
      })
    }

    // captures if there's something to capture
    for (const dest of [coord.ne(), coord.nw()]) {
      const target = board.at(dest)
      if (isBlackPiece(target))
        moves.push({
          kind: 'normal',
          from: coord,
          to: dest,
          promotion: dest.y === 7 ? Piece.WhiteQueen : null,
          capture: target,
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
          capture: Piece.BlackPawn,
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
          promotion: dest.y === 0 ? Piece.BlackQueen : null,
          capture: PieceEmpty,
        })
    }

    // going down 2 if empty && we are on the seventh rank
    if (coord.y === 6 && board.isEmpty(coord.s()) && board.isEmpty(coord.s().s())) {
      moves.push({
        kind: 'normal',
        from: coord,
        to: coord.s().s(),
        promotion: null,
        capture: PieceEmpty,
      })
    }

    // captures if there's something to capture
    for (const dest of [coord.se(), coord.sw()]) {
      const target = board.at(dest)
      if (isWhitePiece(target))
        moves.push({
          kind: 'normal',
          from: coord,
          to: dest,
          promotion: dest.y === 0 ? Piece.BlackQueen : null,
          capture: target,
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
          capture: Piece.WhitePawn,
        })
      }
    }
  }
  return moves
}
