import { Board } from '@/board'
import { Move } from '@/move'
import { Coord } from '@/utils/coord'
import { Uuid } from '@/utils/uuid'
import _ from 'lodash'
import * as R from 'ramda'

export type Record = {
  when: Date
  depth: number
  moves?: number
}

/**
 * If you sort records with this comparator, best records will be on top.
 */
export function compareRecords(a: Record, b: Record, options: { considerDate: boolean }): number {
  // Sort by depth (higher = better), then by number of moves (lower = better)

  if (a.depth > b.depth) return -1
  if (a.depth < b.depth) return 1

  const aMoves = a.moves ?? Infinity
  const bMoves = b.moves ?? Infinity
  if (aMoves < bMoves) return -1
  if (aMoves > bMoves) return 1

  if (options.considerDate) {
    if (a.when < b.when) return -1
    if (a.when > b.when) return 1
  }

  return 0
}

/** Metadata about a challenge. */
export type ChallengeMeta = {
  uuid: Uuid
  title: string
  link?: string
  challenge: string
  /** Records per player */
  records: Map<string, Record>
}

/**
 * Create a leaderboard for a challenge. Each user gets points based on their position in the leaderboard. If two users have the same score, they get the same number of points.
 */
export function challengeLeaderboard(records: Map<string, Record>): Map<string, number> {
  // Get all records
  const results: { user: string; record: Record }[] = Array.from(records.entries()).map(
    ([user, record]) => ({ user, record })
  )

  // Sort and then group equal records together
  const sortedResults: { user: string; record: Record }[][] = R.groupWith(
    (a, b) => compareRecords(a.record, b.record, { considerDate: false }) === 0,
    R.sort((a, b) => compareRecords(a.record, b.record, { considerDate: true }), results)
  )

  // Assign points to each group
  let points = 100
  const leaderboard = new Map<string, number>()
  for (const group of sortedResults) {
    for (const result of group) leaderboard.set(result.user, points)
    points *= 0.9
  }

  return leaderboard
}

/**
 * Figure out who's the best player for a single challenge.
 */
export function challengeWinner(
  records: Map<string, Record>
): { name: string; record: Record } | undefined {
  const winner = _.maxBy(
    Array.from(challengeLeaderboard(records).entries()),
    ([, points]) => points
  )?.[0]
  return winner ? { name: winner, record: records.get(winner)! } : undefined
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
   * This function can abruptly end the challenge if it's been lost.
   */
  isChallengeLost?: (data: { board: Board }) => { lost: boolean }

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
  }) => { coord: Coord; color: 'red' | 'blue' | 'lightYellow' | 'lightRed'; text?: string }[]
}
