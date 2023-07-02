export const enum PieceType {
  Empty = 0,
  Pawn = 1,
  Knight = 2,
  Bishop = 3,
  Rook = 4,
  Queen = 5,
  King = 6,
}

export const allPieceTypes = [
  PieceType.Empty,
  PieceType.Pawn,
  PieceType.Knight,
  PieceType.Bishop,
  PieceType.Rook,
  PieceType.Queen,
  PieceType.King,
]

export const enum Color {
  // NB: apparently somewhere we depend on this not being 0x00 and 0x10, maybe because `pieceColor` can return 0x00 for empty squares and we check it for falsiness somewhere?
  White = 0x10,
  Black = 0x20,
}

/** A chess piece.
 *
 * Can also be `Empty` because Stockfish does this and maybe they have a good reason for it.
 */
export const enum Piece {
  Empty = 0,

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

export const pieceEnumRange = { low: Piece.Empty, high: Piece.BlackKing }

export function pieceType(piece: Piece): PieceType {
  return piece & 0x0f
}

export function pieceColor(piece: Piece): Color {
  return piece & 0xf0
}

export function pieceColorOrEmpty(piece: Piece): Color | null {
  return piece === Piece.Empty ? null : pieceColor(piece)
}

export function makePiece(color: Color, type: PieceType): Piece {
  return type | color
}

export const isPawn = (piece: Piece) => piece === Piece.WhitePawn || piece === Piece.BlackPawn
export const isKnight = (piece: Piece) => piece === Piece.WhiteKnight || piece === Piece.BlackKnight
export const isBishop = (piece: Piece) => piece === Piece.WhiteBishop || piece === Piece.BlackBishop
export const isRook = (piece: Piece) => piece === Piece.WhiteRook || piece === Piece.BlackRook
export const isQueen = (piece: Piece) => piece === Piece.WhiteQueen || piece === Piece.BlackQueen
export const isKing = (piece: Piece) => piece === Piece.WhiteKing || piece === Piece.BlackKing

export const isWhite = (piece: Piece) => pieceColor(piece) === Color.White
export const isBlack = (piece: Piece) => pieceColor(piece) === Color.Black

export function colorName(piece: Piece): 'white' | 'black' {
  return isWhite(piece) ? 'white' : 'black'
}

export function letterToPiece(letter: string): Piece {
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
    default:
      return Piece.Empty
  }
}

export function pieceToLetter(piece: Piece) {
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
    default:
      return '-'
  }
}

export function pieceTypeToLetter(pieceType: PieceType) {
  switch (pieceType) {
    case PieceType.Pawn:
      return 'P'
    case PieceType.Knight:
      return 'N'
    case PieceType.Bishop:
      return 'B'
    case PieceType.Rook:
      return 'R'
    case PieceType.Queen:
      return 'Q'
    case PieceType.King:
      return 'K'
    default:
      return '-'
  }
}
