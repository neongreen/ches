import { Board } from '@/board'
import { getMoveCoords, isInCheck, isInCheckAfterOpponentsMove, Move, moveIsEqual } from '@/move'
import { isKing } from '@/piece'
import { Coord } from '@/utils/coord'
import _ from 'lodash'
import { quasiLegalMoves } from './quasi-legal'

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
  const inCheck = isInCheck(boardAfterMove, boardBeforeMove.side)
  if (process.env.NODE_ENV === 'test') {
    // Testing that isInCheckAfterOpponentsMove === isInCheck
    const inCheck2 = isInCheckAfterOpponentsMove(boardAfterMove, move)
    if (inCheck !== inCheck2)
      throw new Error(
        `isInCheck returned ${inCheck}, but isInCheckAfterOpponentsMove returned ${inCheck2}`
      )
  }
  if (inCheck) return false

  // If we can't rely on the move being quasi-legal (e.g. when we are checking a move that a human player wants to make), we can simply check if the move is in the list of quasi-legal moves. We don't have to worry about speed here and we already know that the move passes all legality checks *except* for actually being a quasi-legal move.
  if (!optAssumeQuasiLegal) {
    if (!quasiLegalMoves(boardBeforeMove).some((m) => moveIsEqual(m, move))) return false
  }

  return true
}

/**
 * Exactly determines if a move is legal, but also does `executeMove()` on its own. Useful for debug.
 */
export function isLegalMoveWithExecute(
  board: Board,
  move: Move,
  options?: { assumeQuasiLegal?: boolean }
): boolean {
  let boardAfterMove = board.clone()
  boardAfterMove.executeMove(move)
  return isLegalMove(board, boardAfterMove, move, options)
}

/**
 * Generate all legal moves. Shouldn't be used in the search, because it's slow.
 */
export function legalMoves_slow(board: Board): Move[] {
  return quasiLegalMoves(board).filter((move) =>
    isLegalMoveWithExecute(board, move, { assumeQuasiLegal: true })
  )
}

/**
 * Generate all legal moves for a certain piece. (Note: even less optimal than `legalMoves_slow`.)
 */
export function legalMovesForPiece_slow(board: Board, coord: Coord): Move[] {
  return legalMoves_slow(board).filter((move) => getMoveCoords(move).from.equals(coord))
}
