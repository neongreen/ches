import { Move } from '@/move'
import { Board } from '@/board'
import { Challenge } from '@/challenges/core'
import { Identity } from '@/identity'
import { Score } from '@/eval/score'
import { Coord } from '@/utils/coord'

/**
 * Best move evaluation result
 */
export interface BestMove {
  move: Move | null
  score: Score
  time: number
  line: Move[]
  nodes: number
}

/**
 * Game status information - matches actual Chess class gameStatus field
 */
export type GameStatus =
  | { status: 'playing' }
  | { status: 'won'; reason: 'checkmate' }
  | { status: 'lost'; reason: 'checkmate' | 'challengeFailed' | 'challengeNoMovesAvailable' }
  | { status: 'draw'; reason: 'threefoldRepetition' | 'other' }

/**
 * Interface defining the chess game state contract for rendering.
 * Uses duck typing to be compatible with both Chess class and mock objects.
 */
export interface IChessState {
  board: Board
  challenge: Challenge | null
  identity: Identity | null
  history: Array<{ move: Move; beforeMove: any; afterMove: any }>
  bestMove: BestMove | null
  gameStatus: GameStatus
  isMoveAllowedByChallenge: (move: Move) => boolean
  lastMove: () => Move | null
}

/**
 * Interface defining the complete game state contract for rendering
 */
export interface IRenderableGameState {
  chess: IChessState
  dragged: Coord | null
  lastMoveTimestamp: number
  makeMove: (move: Move) => void
  updateBestMoveAndGameStatus: (options: { searchDepth: number }) => void
}
