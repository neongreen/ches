import { Board } from '@/board'
import { isInCheck, Move } from '@/move'
import { pieceColor, isKing, Color, Piece, pieceType, PieceType } from '@/piece'
import _ from 'lodash'
import { match } from 'ts-pattern'
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
    const moveColor = match(move)
      .with({ kind: 'normal' }, (move) => pieceColor(boardBeforeMove.at(move.from)))
      .with({ kind: 'castling' }, (move) => pieceColor(boardBeforeMove.at(move.kingFrom)))
      .exhaustive()
    if (moveColor !== boardBeforeMove.side) return false

    const result: boolean = match(move)
      .with({ kind: 'normal' }, (move) => {
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
          // NB: can't use ts-pattern here because https://github.com/gvergnaud/ts-pattern/issues/58
          case PieceType.Empty:
            return false
          case PieceType.Pawn:
            if (!isPawnMoveValid(boardBeforeMove, move)) return false
            break
          case PieceType.Knight:
            if (!isKnightMoveValid(boardBeforeMove, move)) return false
            break
          case PieceType.Bishop:
            if (!isBishopMoveValid(boardBeforeMove, move)) return false
            break
          case PieceType.Rook:
            if (!isRookMoveValid(boardBeforeMove, move)) return false
            break
          case PieceType.Queen:
            if (!isQueenMoveValid(boardBeforeMove, move)) return false
            break
          case PieceType.King:
            if (!isKingMoveValid(boardBeforeMove, move)) return false
            break
        }
        return true
      })
      .with({ kind: 'castling' }, (move) => {
        return isKingMoveValid(boardBeforeMove, move)
      })
      .exhaustive()
    if (!result) return false
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
