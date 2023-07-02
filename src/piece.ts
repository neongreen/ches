export const enum PieceType {
  Pawn = 1,
  Knight = 2,
  Bishop = 3,
  Rook = 4,
  Queen = 5,
  King = 6,
}

export type MaybePieceType = PieceType | 0
export const PieceTypeEmpty = 0

export const allPieceTypes = [
  PieceType.Pawn,
  PieceType.Knight,
  PieceType.Bishop,
  PieceType.Rook,
  PieceType.Queen,
  PieceType.King,
]

export const enum Color {
  White = 0x10,
  Black = 0x20,
}

export type MaybeColor = 0 | Color
export const ColorEmpty = 0

export function invertColor(color: Color): Color {
  return color ^ 0x30
}

export const enum Piece {
  WhitePawn = PieceType.Pawn | Color.White,
  WhiteKnight = PieceType.Knight | Color.White,
  WhiteBishop = PieceType.Bishop | Color.White,
  WhiteRook = PieceType.Rook | Color.White,
  WhiteQueen = PieceType.Queen | Color.White,
  WhiteKing = PieceType.King | Color.White,

  BlackPawn = PieceType.Pawn | Color.Black,
  BlackKnight = PieceType.Knight | Color.Black,
  BlackBishop = PieceType.Bishop | Color.Black,
  BlackRook = PieceType.Rook | Color.Black,
  BlackQueen = PieceType.Queen | Color.Black,
  BlackKing = PieceType.King | Color.Black,
}

export type MaybePiece = 0 | Piece
export const PieceEmpty = 0

export const maybePieceEnumRange = { low: PieceEmpty, high: Piece.BlackKing }

export function pieceType(piece: Piece): PieceType
export function pieceType(piece: MaybePiece): MaybePieceType
export function pieceType(piece: number) {
  return piece & 0x0f
}

export function pieceColor(piece: Piece): Color
export function pieceColor(piece: MaybePiece): MaybeColor
export function pieceColor(piece: number) {
  return piece & 0xf0
}

export function makePiece(color: Color, type: PieceType): Piece {
  return type | color
}

export const isPawn = (piece: Piece | MaybePiece) =>
  piece === Piece.WhitePawn || piece === Piece.BlackPawn
export const isKnight = (piece: Piece | MaybePiece) =>
  piece === Piece.WhiteKnight || piece === Piece.BlackKnight
export const isBishop = (piece: Piece | MaybePiece) =>
  piece === Piece.WhiteBishop || piece === Piece.BlackBishop
export const isRook = (piece: Piece | MaybePiece) =>
  piece === Piece.WhiteRook || piece === Piece.BlackRook
export const isQueen = (piece: Piece | MaybePiece) =>
  piece === Piece.WhiteQueen || piece === Piece.BlackQueen
export const isKing = (piece: Piece | MaybePiece) =>
  piece === Piece.WhiteKing || piece === Piece.BlackKing

export const isWhitePiece = (piece: Piece | MaybePiece) => pieceColor(piece) === Color.White
export const isBlackPiece = (piece: Piece | MaybePiece) => pieceColor(piece) === Color.Black

export function colorName(piece: Piece): 'white' | 'black' {
  return isWhitePiece(piece) ? 'white' : 'black'
}

export function letterToPiece(letter: string): MaybePiece {
  switch (letter) {
    case 'P':
      return Piece.WhitePawn
    case 'N':
      return Piece.WhiteKnight
    case 'B':
      return Piece.WhiteBishop
    case 'R':
      return Piece.WhiteRook
    case 'Q':
      return Piece.WhiteQueen
    case 'K':
      return Piece.WhiteKing
    case 'p':
      return Piece.BlackPawn
    case 'n':
      return Piece.BlackKnight
    case 'b':
      return Piece.BlackBishop
    case 'r':
      return Piece.BlackRook
    case 'q':
      return Piece.BlackQueen
    case 'k':
      return Piece.BlackKing
    case '-':
      return PieceEmpty
    default:
      throw new Error(`Invalid piece letter: ${letter}`)
  }
}

export function pieceToLetter(piece: MaybePiece) {
  switch (piece) {
    case Piece.WhitePawn:
      return 'P'
    case Piece.WhiteKnight:
      return 'N'
    case Piece.WhiteBishop:
      return 'B'
    case Piece.WhiteRook:
      return 'R'
    case Piece.WhiteQueen:
      return 'Q'
    case Piece.WhiteKing:
      return 'K'
    case Piece.BlackPawn:
      return 'p'
    case Piece.BlackKnight:
      return 'n'
    case Piece.BlackBishop:
      return 'b'
    case Piece.BlackRook:
      return 'r'
    case Piece.BlackQueen:
      return 'q'
    case Piece.BlackKing:
      return 'k'
    case PieceEmpty:
      return '-'
  }
}

export function pieceTypeToLetter(pieceType: MaybePieceType) {
  switch (pieceType) {
    case PieceType.Pawn:
      return 'P'
    case PieceType.Knight:
      return 'N'
    case PieceType.Bishop:
      return 'B'
    case PieceType.Queen:
      return 'Q'
    case PieceType.King:
      return 'K'
    case PieceType.Rook:
      return 'R'
    case PieceTypeEmpty:
      return '-'
  }
}
