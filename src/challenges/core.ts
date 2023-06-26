import { Board } from '@/board'
import { Move } from '@/move'

/**
 * A chess challenge.
 */
export type Challenge = {
  uuid: string
  title: string
  link?: string
  challenge: string

  /**
   * The best player so far (challenge beaten at highest depth).
   */
  beaten?: {
    name: string
    depth: number
  }

  /**
   * Constraints like "can't move to white squares" etc.
   *
   * TODO stop assuming that the human is playing white
   */
  isMoveAllowed(data: {
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
  }): boolean
}
