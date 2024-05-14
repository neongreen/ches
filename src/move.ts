import { Board } from '@/board'
import { isKingAttackedByColor, isKingAttackedByPiece } from '@/move/attacked'
import {
  Color,
  MaybePiece,
  Piece,
  PieceEmpty,
  PieceType,
  PieceTypeEmpty,
  isBishop,
  isPawn,
  isQueen,
  isRook,
  pieceColor,
  pieceToLetter,
  pieceType,
  pieceTypeToLetter,
} from '@/piece'
import { Coord } from '@/utils/coord'
import { P, match } from 'ts-pattern'
import { castlingMoves } from './move/pieces/king'

export type Move =
  | { kind: 'normal'; from: Coord; to: Coord; promotion: Piece | null; capture: MaybePiece }
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
      capture: Piece
      captureCoord: Coord
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
 * Determine if the current side is in check after the opponent's (legal) move.
 *
 * Faster than `isInCheck` in most cases.
 */
export function isInCheckAfterOpponentsMove(board: Board, move: Move): boolean {
  // En passant and castling are rare enough that we can just use normal `isInCheck` (recommended by chessprogramming)
  return match(move)
    .with({ kind: P.union('enPassant', 'castling') }, () => isInCheck(board, board.side))
    .with({ kind: 'normal' }, (move) => {
      // The king might be attacked by the moved piece
      if (isKingAttackedByPiece(board, move.to)) return true
      // The king might also be attacked by a piece that was behind the moved piece. There is at most one ray that goes through the moved piece and the king, so we only need to check in one direction.
      const king = board.side === Color.White ? board.kings.white : board.kings.black
      const directionDelta = king.unitDeltaTowards(move.from)
      if (directionDelta === null) return false
      const villain = board.unsafeFindPieceInDirection(move.from, directionDelta)
      if (villain === null || pieceColor(villain.piece) === board.side) return false
      if (directionDelta.x === 0 || directionDelta.y === 0) {
        return isRook(villain.piece) || isQueen(villain.piece)
      } else {
        return isBishop(villain.piece) || isQueen(villain.piece)
      }
    })
    .exhaustive()
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
      switch (pieceType(pieceFrom)) {
        case PieceType.Pawn: {
          let notation = ''
          if (move.capture !== PieceEmpty) notation += move.from.toAlgebraic().charAt(0) + 'x'
          notation += move.to.toAlgebraic()
          if (move.promotion) notation += '=' + pieceToLetter(move.promotion).toUpperCase()
          return notation
        }
        default: {
          return (
            pieceTypeToLetter(pieceType(pieceFrom)) +
            (move.capture ? 'x' : '') +
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
      () =>
        ({
          kind: 'enPassant',
          from: drag.from,
          to: drag.to,
          capture: board.at(board.enPassantTargetPawn()!) as Piece,
          captureCoord: board.enPassantTargetPawn()!,
        } satisfies Move)
    )
    .otherwise(
      () =>
        ({
          kind: 'normal',
          from: drag.from,
          to: drag.to,
          promotion:
            piece === Piece.WhitePawn && drag.to.y === 7
              ? Piece.WhiteQueen
              : piece === Piece.BlackPawn && drag.to.y === 0
              ? Piece.BlackQueen
              : null,
          capture: board.at(drag.to),
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
export function getMoveCoords(move: Move): { from: Coord; to: Coord } {
  return match(move)
    .with({ kind: P.union('normal', 'enPassant') }, ({ from, to }) => ({ from, to }))
    .with({ kind: 'castling' }, ({ kingFrom, kingTo }) => ({ from: kingFrom, to: kingTo }))
    .exhaustive()
}

/**
 * Like `getMoveCoord`, but for all pieces that moved. (Both king and rook in case of castling.)
 *
 * In case of promotion, `pieceBefore` is the pawn and `pieceAfter` is the promoted piece.
 */
export function getAllMovers(
  board: Board,
  move: Move
): { from: Coord; to: Coord; pieceBefore: MaybePiece; pieceAfter: MaybePiece }[] {
  return match(move)
    .with({ kind: 'normal' }, ({ from, to, promotion }) => [
      { from, to, pieceBefore: board.at(from), pieceAfter: promotion ?? board.at(from) },
    ])
    .with({ kind: 'enPassant' }, ({ from, to }) => [
      { from, to, pieceBefore: board.at(from), pieceAfter: board.at(from) },
    ])
    .with({ kind: 'castling' }, ({ kingFrom, kingTo, rookFrom, rookTo }) => {
      const king = board.at(kingFrom)
      const rook = board.at(rookFrom)
      return [
        { from: kingFrom, to: kingTo, pieceBefore: king, pieceAfter: king },
        { from: rookFrom, to: rookTo, pieceBefore: rook, pieceAfter: rook },
      ]
    })
    .exhaustive()
}

/**
 * Which piece is doing the move? (Castling is assumed to be done by the king.)
 */
export function getMovePiece(board: Board, move: Move): MaybePiece {
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
export function isCapture(move: Move): boolean {
  return 'capture' in move && move.capture !== PieceEmpty
}

/**
 * Like `isCapture`, but returns the captured piece and its coordinates.
 */
export function getCapture(
  move: Move
): { attacker: Coord; victim: Coord; victimPiece: Piece; newAttackerPosition: Coord } | null {
  return match(move)
    .with({ kind: 'normal' }, ({ from, to, capture }) =>
      capture !== PieceEmpty
        ? { attacker: from, victim: to, victimPiece: capture, newAttackerPosition: to }
        : null
    )
    .with({ kind: 'castling' }, () => null)
    .with({ kind: 'enPassant' }, ({ from, to, capture, captureCoord }) => ({
      attacker: from,
      victim: captureCoord,
      victimPiece: capture,
      newAttackerPosition: to,
    }))
    .exhaustive()
}
