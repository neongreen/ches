/**
 * Zobrist hashing: https://www.chessprogramming.org/Zobrist_Hashing
 *
 * This is a way to hash a chess position, while also being able to quickly update the hash when the position changes a bit (e.g. a piece is moved or castling rights are lost) without having to recompute the whole hash.
 */

import { Piece, pieceEnumRange } from './piece'
import { Coord } from './utils/coord'
import { XORShift64 } from 'random-seedable'

export type Zobrist = number

const random = new XORShift64(1337)

function zobristRandom(): Zobrist {
  // We use 25 bits instead of 47 because apparently in V8 only integers up to 2^31-1 are represented as "small integer"
  return random.randRange(0, 2 ** 25 - 1)
}

const ZOBRIST: Zobrist[] = []

// We generate a random number for each piece*square combination.
// Instead of XOR, we will be using addition and subtraction.
//
// https://www.chessprogramming.org/Zobrist_Hashing#Lack_a_True_Integer_Type
for (let piece = pieceEnumRange.low; piece <= pieceEnumRange.high; piece++) {
  for (let i = 0; i < 64; i++) ZOBRIST.push(zobristRandom())
}

/** Get the Zobrist hash for a piece on a square. */
export function zobristPiece(piece: Piece, coord: Coord): Zobrist {
  return ZOBRIST[piece * 64 + (coord.y * 8 + coord.x)]
}

/** Get the Zobrist hash for the side to move.
 *
 * When it's white, add this hash. When it's black, subtract it.
 */
export const zobristWhiteToMove = zobristRandom()

/** Get the Zobrist hash for a castling right. */
export const zobristCastling = {
  white: {
    kingside: zobristRandom(),
    queenside: zobristRandom(),
  },
  black: {
    kingside: zobristRandom(),
    queenside: zobristRandom(),
  },
}
