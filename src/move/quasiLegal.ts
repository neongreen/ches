import { Board } from '@/board'
import { Move } from '@/move'
import { Piece, pieceColor, PieceType, pieceType } from '@/piece'
import { Coord } from '@/utils/coord'
import { bishopMoves } from './pieces/bishop'
import { kingMoves } from './pieces/king'
import { knightMoves } from './pieces/knight'
import { pawnMoves } from './pieces/pawn'
import { queenMoves } from './pieces/queen'
import { rookMoves } from './pieces/rook'

/**
 * Generate possible moves for the current side, without advanced checks like
 * "is the king in check?"
 */
export function quasiLegalMoves(board: Board): Move[] {
  let moves: Move[] = []
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      const coord = new Coord(x, y)
      const piece = board.unsafeAt(coord)
      if (pieceColor(piece) === board.side) moves.push(...quasiLegalMovesFrom(board, piece, coord))
    }
  }
  return moves
}

/**
 * Generate possible moves for a specific piece, without advanced checks.
 */
export function quasiLegalMovesFrom(board: Board, piece: Piece, coord: Coord): Move[] {
  switch (pieceType(piece)) {
    case PieceType.Empty:
      return []
    case PieceType.Pawn:
      return pawnMoves(board, pieceColor(piece), coord)
    case PieceType.Bishop:
      return bishopMoves(board, pieceColor(piece), coord)
    case PieceType.Knight:
      return knightMoves(board, pieceColor(piece), coord)
    case PieceType.Rook:
      return rookMoves(board, pieceColor(piece), coord)
    case PieceType.Queen:
      return queenMoves(board, pieceColor(piece), coord)
    case PieceType.King:
      return kingMoves(board, pieceColor(piece), coord)
  }
}
