import { Board } from '@/board'
import { isInCheck, Move, moveIsEqual } from '@/move'
import { isKing } from '@/piece'
import _ from 'lodash'
import { quasiLegalMoves } from './quasiLegal'

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
    case 'enPassant':
      break
  }

  // The side to move must not be in check after the move
  if (isInCheck(boardAfterMove, boardBeforeMove.side)) return false

  // If we can't rely on the move being quasi-legal (e.g. when we are checking a move that a human player wants to make), we can simply check if the move is in the list of quasi-legal moves. We don't have to worry about speed here and we already know that the move passes all legality checks *except* for actually being a quasi-legal move.
  if (!optAssumeQuasiLegal) {
    if (!quasiLegalMoves(boardBeforeMove).some((m) => moveIsEqual(m, move))) return false
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
