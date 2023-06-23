import { Board } from '@/board'
import { classifyMovePiece, Move, moveIsEqual } from '@/move'
import { legalMoves_slow } from '@/move/legal'
import { isBlack, isPawn } from '@/piece'
import _ from 'lodash'
import { match } from 'ts-pattern'

/**
 * A Chess Simp challenge.
 */
export type Challenge = {
  videoTitle: string
  videoUrl: string

  /**
   * Challenge as done by Simp (potentially with additions/changes to the original challenge).
   */
  challenge: string

  /**
   * Constraints like "can't move to white squares" etc.
   *
   * TODO stop assuming that the human is playing white
   */
  isMoveAllowed(board: Board, move: Move): boolean
}

const _2022_09_26: Challenge = {
  videoTitle: 'My Favorite Opening',
  videoUrl: 'https://www.youtube.com/watch?v=OSCDE_ebc1c',
  challenge:
    'Chess, but your pieces (and pawns) are vampires. They cannot step into the light (squares).',
  isMoveAllowed(board: Board, move: Move): boolean {
    // Can only move to dark squares.
    return match(move)
      .with({ kind: 'normal' }, ({ to }) => to.color() === 'dark')
      .with({ kind: 'enPassant' }, ({ to }) => to.color() === 'dark')
      .with(
        { kind: 'castling' },
        ({ kingTo, rookTo }) => kingTo.color() === 'dark' && rookTo.color() === 'dark'
      )
      .exhaustive()
  },
}

const _2022_05_24: Challenge = {
  videoTitle: 'Slow And Steady',
  videoUrl: 'https://www.youtube.com/watch?v=VwH-Gqzfpos',
  challenge: 'Chess, but you can only move pieces (and pawns) one square at a time.',
  isMoveAllowed(board: Board, move: Move): boolean {
    return match(move)
      .with({ kind: 'normal' }, ({ from, to }) => from.chessboardDistance(to) === 1)
      .with({ kind: 'enPassant' }, ({ from, to }) => from.chessboardDistance(to) === 1)
      .with({ kind: 'castling' }, () => false)
      .exhaustive()
  },
}

const _2022_06_03: Challenge = {
  videoTitle: "I Don't See Anything Wrong",
  videoUrl: 'https://www.youtube.com/watch?v=uc4gT029pNA',
  challenge: 'Chess, but your pieces (and pawns) are always right. You cannot move them leftward.',
  isMoveAllowed(board: Board, move: Move): boolean {
    return match(move)
      .with({ kind: 'normal' }, ({ from, to }) => from.x <= to.x)
      .with({ kind: 'enPassant' }, ({ from, to }) => from.x <= to.x)
      .with({ kind: 'castling' }, () => false)
      .exhaustive()
  },
}

const _2022_01_29: Challenge = {
  videoTitle: 'Our Kings Almost Touched',
  videoUrl: 'https://www.youtube.com/watch?v=sEdZU-0oHdM',
  challenge: 'Chess, but if your pawn can move, it has to.',
  isMoveAllowed(board: Board, move: Move): boolean {
    // Note: per 3:02 in the video, if you're in check you can move a non-pawn (which is incidentally what this code already does.)
    const pawnMoves = legalMoves_slow(board).filter((move) =>
      isPawn(classifyMovePiece(board, move))
    )
    return pawnMoves.length === 0 || pawnMoves.some((pawnMove) => moveIsEqual(pawnMove, move))
  },
}

const _2022_03_07: Challenge = {
  videoTitle: 'Such Torture',
  videoUrl: 'https://www.youtube.com/watch?v=IfeUGBXaOUk',
  challenge:
    'Chess, but your king is a commander, you can only move something if your king can see it.',
  isMoveAllowed(board: Board, move: Move): boolean {
    // Only pieces with distance=1 to the king are allowed to move. (1:05 in the video - line of sight doesn't count as "can see"). Unclear if castling is allowed, and theoretically it *can* happen if the opponent takes your N and B - but let's say it's not allowed.
    return (
      match(move)
        // TODO: once again we are assuming that the human is playing white
        .with({ kind: 'normal' }, ({ from }) => board.kings.white.chessboardDistance(from) <= 1)
        .with({ kind: 'enPassant' }, ({ from }) => board.kings.white.chessboardDistance(from) <= 1)
        .with({ kind: 'castling' }, () => false)
        .exhaustive()
    )
  },
}

const _2022_03_29: Challenge = {
  videoTitle: "I Don't Invade Anyone Today",
  videoUrl: 'https://www.youtube.com/watch?v=XQZFvszSddk',
  challenge: "Chess but your pawns and pieces can't cross the half-way line.",
  isMoveAllowed(board: Board, move: Move): boolean {
    return (
      match(move)
        // TODO: once again we are assuming that the human is playing white
        .with({ kind: 'normal' }, ({ to }) => to.y <= 3)
        .with({ kind: 'enPassant' }, ({ to }) => to.y <= 3)
        .with({ kind: 'castling' }, () => true)
        .exhaustive()
    )
  },
}

const _2022_05_30: Challenge = {
  videoTitle: 'He Offered A Draw...',
  videoUrl: 'https://www.youtube.com/watch?v=kfxg5wGLVBw',
  challenge: '100 rated chess but you can only take their most extended piece or pawn.',
  isMoveAllowed(board: Board, move: Move): boolean {
    // If there are several pieces that are equally extended, you can take any of them (1:19). If you're not taking a piece, you can do whatever you want.
    const blackPieces = board.pieces().filter(({ piece }) => isBlack(piece))
    const mostExtendedRow: number = _.min(blackPieces.map(({ coord }) => coord.y))!
    return match(move)
      .with({ kind: 'normal' }, ({ to }) => board.isEmpty(to) || to.y === mostExtendedRow)
      .with({ kind: 'enPassant' }, () => board.enPassantTargetPawn()!.y === mostExtendedRow)
      .with({ kind: 'castling' }, () => true)
      .exhaustive()
  },
}

/**
 * All Chess Simp challenges.
 */
export const challenges: Challenge[] = _.concat(
  // Jan 2022
  [_2022_01_29],
  // Mar 2022
  [_2022_03_07, _2022_03_29],
  // May 2022
  [_2022_05_24, _2022_05_30],
  // Jun 2022
  [_2022_06_03],
  // Sep 2022
  [_2022_09_26]
)
