/** Everything related to how the king moves. */

import { Board } from '@/board'
import { Move } from '@/move'
import { Color, pieceColor } from '@/piece'
import { Coord } from '@/utils/coord'
import _ from 'lodash'
import { isAttackedByColor } from '../attacked'
import { match, P } from 'ts-pattern'

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
export function kingMoves(board: Board, coord: Coord): Move[] {
  let moves: Move[] = []
  const piece = board.at(coord)

  // Normal moves
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      if (x === 0 && y === 0) continue
      const target = coord.shift({ x, y })
      if (target.isValid() && pieceColor(board.at(target)) !== pieceColor(piece)) {
        moves.push({ kind: 'normal', from: coord, to: target })
      }
    }
  }

  // Castling
  const checkCastling = (move: Extract<Move, { kind: 'castling' }>) => {
    const opposite = pieceColor(piece) === Color.White ? Color.Black : Color.White
    return (
      move.kingFrom
        .pathTo(move.kingTo, 'inclusive')
        .every((c) => !isAttackedByColor(board, opposite, c)) &&
      move.kingFrom.pathTo(move.rookFrom, 'exclusive').every((c) => board.isEmpty(c))
    )
  }

  if (pieceColor(piece) === Color.White) {
    if (board.castlingRights.white.kingside) {
      const move: Move = { kind: 'castling', ...castlingMoves.white.kingside }
      if (checkCastling(move)) moves.push(move)
    }
    if (board.castlingRights.white.queenside) {
      const move: Move = { kind: 'castling', ...castlingMoves.white.queenside }
      if (checkCastling(move)) moves.push(move)
    }
  } else {
    if (board.castlingRights.black.kingside) {
      const move: Move = { kind: 'castling', ...castlingMoves.black.kingside }
      if (checkCastling(move)) moves.push(move)
    }
    if (board.castlingRights.black.queenside) {
      const move: Move = { kind: 'castling', ...castlingMoves.black.queenside }
      if (checkCastling(move)) moves.push(move)
    }
  }
  return moves
}

/**
 * Is a king move valid? (Does not take checks into account, except for castling.)
 */
export function isKingMoveValid(board: Board, move: Move) {
  return match(move)
    .with({ kind: 'normal' }, (move) => kingMoves(board, move.from).some((m) => _.isEqual(m, move)))
    .with({ kind: 'castling' }, (move) =>
      kingMoves(board, move.kingFrom).some((m) => _.isEqual(m, move))
    )
    .exhaustive()
}
