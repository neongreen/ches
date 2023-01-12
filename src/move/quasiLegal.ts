import { Board } from '@/board'
import { Move } from '@/move'
import { PieceType, pieceType } from '@/piece'
import { Coord } from '@/utils/coord'
import { bishopMoves } from './pieces/bishop'
import { kingMoves } from './pieces/king'
import { knightMoves } from './pieces/knight'
import { pawnMoves } from './pieces/pawn'
import { queenMoves } from './pieces/queen'
import { rookMoves } from './pieces/rook'

/**
 * Generates possible moves for a specific piece based on how pieces move, but without advanced checks like "is the king in check?"
 */
export function quasiLegalNormalMoves(board: Board, coord: Coord): Move[] {
  const piece = board.at(coord)
  switch (pieceType(piece)) {
    case PieceType.Empty:
      return []
    case PieceType.Pawn:
      return pawnMoves(board, coord)
    case PieceType.Bishop:
      return bishopMoves(board, coord)
    case PieceType.Knight:
      return knightMoves(board, coord)
    case PieceType.Rook:
      return rookMoves(board, coord)
    case PieceType.Queen:
      return queenMoves(board, coord)
    case PieceType.King:
      return kingMoves(board, coord)
  }
}
