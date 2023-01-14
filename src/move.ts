import { Coord } from '@/utils/coord'
import { Piece, pieceToLetter, pieceType, PieceType, pieceTypeToLetter, Color } from '@/piece'
import { Board } from '@/board'
import { isAttackedByColor } from '@/move/attacked'
import { match } from 'ts-pattern'

export type Move =
  | { kind: 'normal'; from: Coord; to: Coord; promotion?: Piece }
  | {
      kind: 'castling'
      kingFrom: Coord
      kingTo: Coord
      rookFrom: Coord
      rookTo: Coord
    }

/**
 * Determines if a certain side is in check.
 */
export function isInCheck(board: Board, color: Color): boolean {
  if (color === Color.White) {
    return isAttackedByColor(board, Color.Black, board.kings.white)
  } else {
    return isAttackedByColor(board, Color.White, board.kings.black)
  }
}

/**
 * Render a move in algebraic notation.
 */
export function notateMove(board: Board, move: Move): string {
  const algebraicCoord = (coord: Coord) => {
    return String.fromCharCode('a'.charCodeAt(0) + coord.x) + (coord.y + 1)
  }

  return match(move)
    .with({ kind: 'normal' }, (move) => {
      const pieceFrom = board.at(move.from)
      const pieceTo = board.at(move.to)
      switch (pieceType(pieceFrom)) {
        case PieceType.Empty: {
          throw new Error('move.from is empty')
        }
        case PieceType.Pawn: {
          let notation = ''
          if (pieceTo !== Piece.Empty) notation += algebraicCoord(move.from).charAt(0) + 'x'
          notation += algebraicCoord(move.to)
          if (move.promotion) notation += '=' + pieceToLetter(move.promotion).toUpperCase()
          return notation
        }
        default: {
          return (
            pieceTypeToLetter(pieceType(pieceFrom)) +
            (pieceTo === Piece.Empty ? '' : 'x') +
            algebraicCoord(move.to)
          )
        }
      }
    })
    .with({ kind: 'castling' }, (move) => {
      return move.kingTo.x > move.kingFrom.x ? 'O-O' : 'O-O-O'
    })
    .exhaustive()
}

/**
 * Render all moves in a line in algebraic notation.
 */
export function notateLine(board: Board, line: Move[]): string[] {
  const board_ = board.clone()
  const result = []
  for (const move of line) {
    result.push(notateMove(board_, move))
    board_.executeMove(move)
  }
  return result
}
