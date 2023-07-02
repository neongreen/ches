/**
 * Piece-square tables give an eval bonus for pieces that are on their "right" squares.
 *
 * See https://rustic-chess.org/evaluation/psqt.html
 */

import { MaybePiece, Piece, maybePieceEnumRange } from '@/piece'
import { Coord } from '@/utils/coord'
import assert from 'assert'

function key(c: string): number {
  switch (c) {
    case '.':
      return 0
    case 'A':
      return 5
    case 'B':
      return 10
    case 'C':
      return 15
    case 'D':
      return 20
    default:
      throw new Error(`Invalid value char: ${c}`)
  }
}

// Kings are encouraged to castle and hide
const whiteKingPST = [
  '........',
  '........',
  '........',
  '........',
  '........',
  '........',
  '........',
  '.BB...B.',
]
const blackKingPST = [...whiteKingPST].reverse()

// Rooks are encouraged to be in the center, and on the 7th rank
const whiteRookPST = [
  '........',
  'BBBBBBBB',
  '........',
  '........',
  '........',
  '........',
  '........',
  '...BB...',
]
const blackRookPST = [...whiteRookPST].reverse()

// Knights are encouraged to be in the center
const knightPST = [
  '........',
  '..AAAA..',
  '.ABCCBA.',
  '.ACDDCA.',
  '.ACDDCA.',
  '.ABCCBA.',
  '..AAAA..',
  '........',
]

const PIECE_SQUARE_TABLE: number[] = []

assert(maybePieceEnumRange.low === 0)
for (let piece: MaybePiece = maybePieceEnumRange.low; piece <= maybePieceEnumRange.high; piece++) {
  for (let i = 0; i < 64; i++) {
    const coord = new Coord(i % 8, Math.floor(i / 8))
    switch (piece) {
      case Piece.WhiteKing:
        PIECE_SQUARE_TABLE.push(key(whiteKingPST[7 - coord.y][coord.x]))
        break
      case Piece.BlackKing:
        PIECE_SQUARE_TABLE.push(key(blackKingPST[7 - coord.y][coord.x]))
        break
      case Piece.WhiteRook:
        PIECE_SQUARE_TABLE.push(key(whiteRookPST[7 - coord.y][coord.x]))
        break
      case Piece.BlackRook:
        PIECE_SQUARE_TABLE.push(key(blackRookPST[7 - coord.y][coord.x]))
        break
      case Piece.WhiteKnight:
      case Piece.BlackKnight:
        PIECE_SQUARE_TABLE.push(key(knightPST[7 - coord.y][coord.x]))
        break
      default:
        PIECE_SQUARE_TABLE.push(0)
    }
  }
}

/** Get the piece-square table bonus for a piece on a square. */
export function pieceSquareBonus(piece: MaybePiece, coord: Coord): number {
  return PIECE_SQUARE_TABLE[piece * 64 + (coord.y * 8 + coord.x)]
}
