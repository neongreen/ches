/** Everything related to how the king moves. */

import { Board } from '@/board'
import { Move } from '@/move'
import { Color, MaybePiece, invertColor, pieceColor } from '@/piece'
import { Castling } from '@/utils/castling'
import { Coord } from '@/utils/coord'
import _ from 'lodash'
import { isKingAttackedByColor } from '../attacked'

export const castlingMoves = {
  white: {
    kingside: {
      kingFrom: new Coord(4, 0),
      kingTo: new Coord(6, 0),
      rookFrom: new Coord(7, 0),
      rookTo: new Coord(5, 0),
    },
    queenside: {
      kingFrom: new Coord(4, 0),
      kingTo: new Coord(2, 0),
      rookFrom: new Coord(0, 0),
      rookTo: new Coord(3, 0),
    },
  },
  black: {
    kingside: {
      kingFrom: new Coord(4, 7),
      kingTo: new Coord(6, 7),
      rookFrom: new Coord(7, 7),
      rookTo: new Coord(5, 7),
    },
    queenside: {
      kingFrom: new Coord(4, 7),
      kingTo: new Coord(2, 7),
      rookFrom: new Coord(0, 7),
      rookTo: new Coord(3, 7),
    },
  },
}

/**
 * All possible king moves on the board, including captures.
 */
export function kingMoves(board: Board, color: Color, coord: Coord): Move[] {
  let moves: Move[] = []

  // Normal moves
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      if (x === 0 && y === 0) continue
      const target = coord.shift({ x, y })
      if (target.isValid() && pieceColor(board.at(target)) !== color) {
        moves.push({
          kind: 'normal',
          from: coord,
          to: target,
          promotion: null,
          capture: board.at(target),
        })
      }
    }
  }

  // Castling
  const checkCastling = (move: Extract<Move, { kind: 'castling' }>) => {
    const opposite = invertColor(color)
    return (
      move.kingFrom.pathTo(move.rookFrom, 'exclusive').every((c) => board.unsafeIsEmpty(c)) &&
      move.kingFrom
        .pathTo(move.kingTo, 'inclusive')
        .every((c) => !isKingAttackedByColor(board, opposite, c))
    )
  }

  if (color === Color.White) {
    if (board.hasCastling(Castling.WhiteKingside)) {
      const move: Move = { kind: 'castling', ...castlingMoves.white.kingside }
      if (checkCastling(move)) moves.push(move)
    }
    if (board.hasCastling(Castling.WhiteQueenside)) {
      const move: Move = { kind: 'castling', ...castlingMoves.white.queenside }
      if (checkCastling(move)) moves.push(move)
    }
  } else {
    if (board.hasCastling(Castling.BlackKingside)) {
      const move: Move = { kind: 'castling', ...castlingMoves.black.kingside }
      if (checkCastling(move)) moves.push(move)
    }
    if (board.hasCastling(Castling.BlackQueenside)) {
      const move: Move = { kind: 'castling', ...castlingMoves.black.queenside }
      if (checkCastling(move)) moves.push(move)
    }
  }
  return moves
}
