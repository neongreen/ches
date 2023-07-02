import { MaybePiece, MaybePieceType, PieceType, PieceTypeEmpty, pieceType } from '@/piece'

export function pieceValue(piece: MaybePiece) {
  return pieceTypeValue(pieceType(piece))
}

export function pieceTypeValue(pieceType: MaybePieceType) {
  switch (pieceType) {
    case PieceTypeEmpty:
      return 0
    case PieceType.Pawn:
      return 1
    case PieceType.Knight:
      return 3
    case PieceType.Bishop:
      return 3
    case PieceType.Rook:
      return 5
    case PieceType.Queen:
      return 9
    case PieceType.King:
      return 4
  }
}
