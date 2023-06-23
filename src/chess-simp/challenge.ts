import { Board } from '@/board'
import { Move } from '@/move'
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

const _20220926: Challenge = {
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

/**
 * All Chess Simp challenges.
 */
export const challenges: Challenge[] = [_20220926]
