import { Board } from '@/board'
import { Move } from '@/move'
import { Coord } from '@/utils/coord'
import { Uuid } from '@/utils/uuid'

/** Metadata about a challenge. */
export type ChallengeMeta = {
  uuid: Uuid
  title: string
  link?: string
  challenge: string
  /** The best player so far (challenge beaten at highest depth). */
  beaten?: {
    name: string
    depth: number
  }
}

/**
 * An interface for chess challenge objects.
 *
 * To create a new challenge, you should either use a simple JS object, or create a class implementing the `Challenge` interface if you'd like to keep track of some extra state internally.
 */
export interface Challenge {
  meta: ChallengeMeta

  /**
   * Constraints like "can't move to white squares" etc.
   *
   * TODO stop assuming that the human is playing white
   */
  isMoveAllowed: (data: {
    /**
     * Which move are we currently doing (human notation)?
     *
     * This will be 1 for the first two moves, 2 for the next two moves, etc.
     */
    currentFullMoveNumber: number
    /**
     * Which half-move are we at?
     *
     * This will be 1 for the first move, 2 for the second move, etc.
     */
    currentHalfMoveNumber: number
    /**
     * History of all past moves.
     */
    history: { boardBeforeMove: Board; move: Move }[]
    /**
     * Current state of the board.
     */
    board: Board
    /**
     * The move the human is attempting to perform.
     */
    move: Move
  }) => boolean

  /**
   * This function will be called after any move has been made.
   */
  recordMove?: (data: { move: Move; boardBeforeMove: Board; boardAfterMove: Board }) => void

  /**
   * Should any squares on the board be highlighted?
   */
  highlightSquares?: (data: {
    board: Board
    history: { boardBeforeMove: Board; move: Move }[]
  }) => { coord: Coord; color: 'red' | 'blue'; text?: string }[]
}
