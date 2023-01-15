/**
 * Castling rights as a bitmask of `CastlingRight`s.
 */
export type CastlingBitmask = number

export const enum Castling {
  None = 0,

  WhiteKingside = 1,
  WhiteQueenside = 2,
  BlackKingside = 4,
  BlackQueenside = 8,

  WhiteAny = Castling.WhiteKingside | Castling.WhiteQueenside,
  BlackAny = Castling.BlackKingside | Castling.BlackQueenside,
  Any = Castling.WhiteAny | Castling.BlackAny,
}
