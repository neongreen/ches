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
   * Constraints like "can't move to white squares" etc.
   *
   * TODO stop assuming that the human is playing white
   */
  isMoveAllowed(data: {
    history: { boardBeforeMove: Board; move: Move }[]
    board: Board
    move: Move
  }): boolean
}
