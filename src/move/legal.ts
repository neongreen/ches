import { Board } from '@/board'
import { isInCheck, Move } from '@/move'
import { pieceColor, isKing, Color, Piece, pieceType, PieceType } from '@/piece'
import _ from 'lodash'
import { isBishopMoveValid } from './pieces/bishop'
import { isKingMoveValid } from './pieces/king'
import { isKnightMoveValid } from './pieces/knight'
import { isPawnMoveValid } from './pieces/pawn'
import { isQueenMoveValid } from './pieces/queen'
import { isRookMoveValid } from './pieces/rook'

/**
 * Exactly determines if a move is legal.
 */
export function isLegalMove(
  boardBeforeMove: Board,
  boardAfterMove: Board,
  move: Move,
  options?: {
    // Ignore checks that `quasiLegalNormalMoves` already does
    assumeQuasiLegal?: boolean
  }
): boolean {
  const optAssumeQuasiLegal = options && options.assumeQuasiLegal

  // Taking a king is not allowed
  switch (move.kind) {
    case 'normal':
      if (isKing(boardBeforeMove.at(move.to))) return false
      break
    case 'castling':
      break
  }

  // The side to move must not be in check after the move
  if (isInCheck(boardAfterMove, boardBeforeMove.side)) return false

  // If we can't rely on the move being quasi-legal (e.g. when we are checking
  // a move that a human player wants to make), we have to be more thorough:
  if (!optAssumeQuasiLegal) {
    // It has to be the right side making the move
    switch (move.kind) {
      case 'normal':
        if (pieceColor(boardBeforeMove.at(move.from)) !== boardBeforeMove.side) return false
        break
      case 'castling':
        if (pieceColor(boardBeforeMove.at(move.kingFrom)) !== boardBeforeMove.side) return false
        break
    }

    switch (move.kind) {
      case 'normal': {
        const from = boardBeforeMove.at(move.from)
        const to = boardBeforeMove.at(move.to)
        // No moving outside the board boundaries
        if (!move.from.isValid() || !move.to.isValid()) return false
        // Can't stay in the same spot
        if (move.from.equals(move.to)) return false
        // The 'from' piece has to be there
        if (from === Piece.Empty) return false
        // Capturing your own pieces is not allowed
        if (pieceColor(from) === pieceColor(to)) return false
        // Piece movement rules
        switch (pieceType(from)) {
          case PieceType.Empty:
            return false
          case PieceType.Pawn:
            return isPawnMoveValid(boardBeforeMove, move)
          case PieceType.Knight:
            return isKnightMoveValid(boardBeforeMove, move)
          case PieceType.Bishop:
            return isBishopMoveValid(boardBeforeMove, move)
          case PieceType.Rook:
            return isRookMoveValid(boardBeforeMove, move)
          case PieceType.Queen:
            return isQueenMoveValid(boardBeforeMove, move)
          case PieceType.King:
            return isKingMoveValid(boardBeforeMove, move)
        }
      }
      case 'castling': {
        return isKingMoveValid(boardBeforeMove, move)
      }
    }
  }

  return true
}

/**
 * Exactly determines if a move is legal, but also does `executeMove()` on its own. Useful for debug.
 */
export function isLegalMoveAndExecute(
  board: Board,
  move: Move,
  options?: { assumeQuasiLegal?: boolean }
): boolean {
  let boardAfterMove = board.clone()
  boardAfterMove.executeMove(move)
  return isLegalMove(board, boardAfterMove, move, options)
}
