/**
 * Zobrist hashing: https://www.chessprogramming.org/Zobrist_Hashing
 *
 * This is a way to hash a chess position, while also being able to quickly update the hash when the position changes a bit (e.g. a piece is moved or castling rights are lost) without having to recompute the whole hash.
 */

import { Piece, pieceEnumRange } from './piece'
import { Coord } from './utils/coord'
import { XORShift64 } from 'random-seedable'
import assert from 'assert'

export type Zobrist = number

const random = new XORShift64(1337)

function zobristRandom(): Zobrist {
  // We can't use the 47 bit trick from https://www.chessprogramming.org/Zobrist_Hashing#Lack_a_True_Integer_Type, because apparently in V8 only integers up to 2^31-1 are represented as "small integers". So instead we use 30 bits and XOR.
  return random.randRange(0, 2 ** 30 - 1)
}

const ZOBRIST: Zobrist[] = []

// We generate a random number for each piece*square combination.
assert(pieceEnumRange.low === 0)
for (let piece = pieceEnumRange.low; piece <= pieceEnumRange.high; piece++) {
  for (let i = 0; i < 64; i++) ZOBRIST.push(zobristRandom())
}

/** Get the Zobrist hash for a piece on a square. */
export function zobristPiece(piece: Piece, coord: Coord): Zobrist {
  return ZOBRIST[piece * 64 + (coord.y * 8 + coord.x)]
}

/** Get the Zobrist hash for the side to move.
 *
 * When it's white, XOR this with the hash. When it's black, XOR this with the hash again.
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
