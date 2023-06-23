import { Board } from '@/board'
import { classifyMovePiece, Move, moveIsEqual } from '@/move'
import { legalMoves_slow } from '@/move/legal'
import { isPawn } from '@/piece'
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
    const pawnMoves = legalMoves_slow(board).filter((move) =>
      isPawn(classifyMovePiece(board, move))
    )
    return pawnMoves.length === 0 || pawnMoves.some((pawnMove) => moveIsEqual(pawnMove, move))
  },
}

/**
 * All Chess Simp challenges.
 */
export const challenges: Challenge[] = _.concat(
  // Jan 2022
  [_2022_01_29],
  // May 2022
  [_2022_05_24],
  // Jun 2022
  [_2022_06_03],
  // Sep 2022
  [_2022_09_26]
)
