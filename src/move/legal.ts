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
  board: Board,
  move: Move,
  options?: {
    // Ignore checks that `quasiLegalNormalMoves` already does
    assumeQuasiLegal?: boolean
    // Allow king captures and moving when in check
    ignoreCheck?: boolean
  }
) {
  const optIgnoreCheck = options && options.ignoreCheck
  const optAssumeQuasiLegal = options && options.assumeQuasiLegal

  /** Which side's piece is being moved? */
  const moveColor = match(move)
    .with({ kind: 'normal' }, (move) => pieceColor(board.at(move.from)))
    .with({ kind: 'castling' }, (move) => pieceColor(board.at(move.kingFrom)))
    .exhaustive()

  // If we aren't ignoring check rules:
  //     - Taking a king is not allowed
  //     - The side to move must not be in check after the move
  // For castling, this doesn't matter.
  if (!optIgnoreCheck) {
    const result: boolean = match(move)
      .with({ kind: 'castling' }, () => true)
      .with({ kind: 'normal' }, (move) => {
        if (isKing(board.at(move.to))) return false
        let newBoard = board.clone()
        newBoard.executeMove(move)
        newBoard.side = newBoard.side === Color.White ? Color.Black : Color.White
        if (isInCheck(newBoard)) return false
        return true
      })
      .exhaustive()
    if (!result) return false
  }

  // If we can't rely on the move being quasi-legal (e.g. when we are checking
  // a move that a human player wants to make), we have to be more thorough:
  if (!optAssumeQuasiLegal) {
    // It has to be the right side making the move
    if (moveColor !== board.side) return false

    const result: boolean = match(move)
      .with({ kind: 'normal' }, (move) => {
        const from = board.at(move.from)
        const to = board.at(move.to)
        // No moving outside the board boundaries
        if (!move.from.isValid() || !move.to.isValid()) return false
        // Can't stay in the same spot
        if (_.isEqual(move.from, move.to)) return false
        // The 'from' piece has to be there
        if (from === Piece.Empty) return false
        // Capturing your own pieces is not allowed
        if (pieceColor(from) === pieceColor(to)) return false
        // Piece movement rules
        switch (pieceType(from)) {
          // NB: can't use ts-pattern here because https://github.com/gvergnaud/ts-pattern/issues/58
          case PieceType.Pawn:
            if (!isPawnMoveValid(board, move)) return false
            break
          case PieceType.Knight:
            if (!isKnightMoveValid(board, move)) return false
            break
          case PieceType.Bishop:
            if (!isBishopMoveValid(board, move)) return false
            break
          case PieceType.Rook:
            if (!isRookMoveValid(board, move)) return false
            break
          case PieceType.Queen:
            if (!isQueenMoveValid(board, move)) return false
            break
          case PieceType.King:
            if (!isKingMoveValid(board, move)) return false
            break
        }
        return true
      })
      .with({ kind: 'castling' }, (move) => {
        return isKingMoveValid(board, move)
      })
      .exhaustive()
    if (!result) return false
  }

  return true
}
