import { Coord } from '@/utils/coord'
import {
  Piece,
  pieceToLetter,
  pieceType,
  PieceType,
  pieceTypeToLetter,
  Color,
  isPawn,
} from '@/piece'
import { Board } from '@/board'
import { isKingAttackedByColor } from '@/move/attacked'
import { match } from 'ts-pattern'
import { castlingMoves } from './move/pieces/king'

export type Move =
  | { kind: 'normal'; from: Coord; to: Coord; promotion?: Piece }
  | {
      kind: 'castling'
      kingFrom: Coord
      kingTo: Coord
      rookFrom: Coord
      rookTo: Coord
    }
  | {
      kind: 'enPassant'
      from: Coord
      to: Coord
      // NB: we can never have a promotion on an en passant move
    }

export function moveIsEqual(a: Move, b: Move) {
  switch (a.kind) {
    case 'normal':
      return (
        b.kind === 'normal' &&
        a.from.equals(b.from) &&
        a.to.equals(b.to) &&
        a.promotion === b.promotion
      )
    case 'castling':
      return (
        b.kind === 'castling' &&
        a.kingFrom.equals(b.kingFrom) &&
        a.kingTo.equals(b.kingTo) &&
        a.rookFrom.equals(b.rookFrom) &&
        a.rookTo.equals(b.rookTo)
      )
    case 'enPassant':
      return b.kind === 'enPassant' && a.from.equals(b.from) && a.to.equals(b.to)
  }
}

/**
 * Determine if a certain side is in check.
 */
export function isInCheck(board: Board, color: Color): boolean {
  if (color === Color.White) {
    return isKingAttackedByColor(board, Color.Black, board.kings.white)
  } else {
    return isKingAttackedByColor(board, Color.White, board.kings.black)
  }
}

/**
 * Render a move in algebraic notation.
 *
 * @param board The board before the move.
 */
export function notateMove(board: Board, move: Move): string {
  switch (move.kind) {
    case 'normal': {
      const pieceFrom = board.at(move.from)
      const pieceTo = board.at(move.to)
      switch (pieceType(pieceFrom)) {
        case PieceType.Empty: {
          throw new Error('move.from is empty')
        }
        case PieceType.Pawn: {
          let notation = ''
          if (pieceTo !== Piece.Empty) notation += move.from.toAlgebraic().charAt(0) + 'x'
          notation += move.to.toAlgebraic()
          if (move.promotion) notation += '=' + pieceToLetter(move.promotion).toUpperCase()
          return notation
        }
        default: {
          return (
            pieceTypeToLetter(pieceType(pieceFrom)) +
            (pieceTo === Piece.Empty ? '' : 'x') +
            move.to.toAlgebraic()
          )
        }
      }
    }
    case 'castling': {
      return move.kingTo.x > move.kingFrom.x ? 'O-O' : 'O-O-O'
    }
    case 'enPassant': {
      return move.from.toAlgebraic().charAt(0) + 'x' + move.to.toAlgebraic()
    }
  }
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

/**
 * Translate a piece drag-and-drop into a (possibly illegal) move.
 *
 * TODO: promotion to other pieces than queen
 */
export function translateFromHumanMove(
  board: Board,
  drag: { from: Coord; to: Coord }
): Move | null {
  const piece = board.at(drag.from)
  return match('')
    .when(
      () => piece === Piece.WhiteKing && drag.to.x - drag.from.x > 1,
      () => ({ kind: 'castling', ...castlingMoves.white.kingside } satisfies Move)
    )
    .when(
      () => piece === Piece.WhiteKing && drag.to.x - drag.from.x < -1,
      () => ({ kind: 'castling', ...castlingMoves.white.queenside } satisfies Move)
    )
    .when(
      () => piece === Piece.BlackKing && drag.to.x - drag.from.x > 1,
      () => ({ kind: 'castling', ...castlingMoves.black.kingside } satisfies Move)
    )
    .when(
      () => piece === Piece.BlackKing && drag.to.x - drag.from.x < -1,
      () => ({ kind: 'castling', ...castlingMoves.black.queenside } satisfies Move)
    )
    .when(
      () =>
        isPawn(piece) && board.enPassantTargetSquare && drag.to.equals(board.enPassantTargetSquare),
      () => ({ kind: 'enPassant', from: drag.from, to: drag.to } satisfies Move)
    )
    .otherwise(
      () =>
        ({
          kind: 'normal',
          from: drag.from,
          to: drag.to,
          ...(piece === Piece.WhitePawn && drag.to.y === 7 ? { promotion: Piece.WhiteQueen } : {}),
          ...(piece === Piece.BlackPawn && drag.to.y === 0 ? { promotion: Piece.BlackQueen } : {}),
        } satisfies Move)
    )
}

/**
 * Translate a move into a piece drag-and-drop.
 */
export function translateToHumanMove(move: Move): { from: Coord; to: Coord } {
  return match(move)
    .with({ kind: 'normal' }, ({ from, to }) => ({ from, to }))
    .with({ kind: 'castling' }, ({ kingFrom, kingTo }) => ({ from: kingFrom, to: kingTo }))
    .with({ kind: 'enPassant' }, ({ from, to }) => ({ from, to }))
    .exhaustive()
}

/**
 * Get `from` and `to` coordinates of the move. (Castling is a king move.)
 *
 * Same as `translateToHumanMove`, but the semantics are different. `translateToHumanMove` corresponds to *display* - how the move looks on the board. `getMoveCoord` corresponds to *logic* - where a piece moved.
 */
export function getMoveCoord(move: Move): { from: Coord; to: Coord } {
  return match(move)
    .with({ kind: 'normal' }, ({ from, to }) => ({ from, to }))
    .with({ kind: 'enPassant' }, ({ from, to }) => ({ from, to }))
    .with({ kind: 'castling' }, ({ kingFrom, kingTo }) => ({ from: kingFrom, to: kingTo }))
    .exhaustive()
}

/**
 * Which piece is doing the move? (Castling is assumed to be done by the king.)
 */
export function getMovePiece(board: Board, move: Move): Piece {
  switch (move.kind) {
    case 'normal':
      return board.at(move.from)
    case 'castling':
      return board.at(move.kingFrom)
    case 'enPassant':
      return board.at(move.from)
  }
}

/**
 * Is the move a capture?
 */
export function isCapture(board: Board, move: Move): boolean {
  return getCapture(board, move) !== null
}

/**
 * Like `isCapture`, but returns the coordinates of the captured piece.
 */
export function getCapture(board: Board, move: Move): { attacker: Coord; victim: Coord } | null {
  return match(move)
    .with({ kind: 'normal' }, ({ from, to }) =>
      board.isOccupied(to) === true ? { attacker: from, victim: to } : null
    )
    .with({ kind: 'castling' }, () => null)
    .with({ kind: 'enPassant' }, ({ from }) => ({
      attacker: from,
      victim: board.enPassantTargetPawn()!,
    }))
    .exhaustive()
}
