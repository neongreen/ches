import { EvalNode } from '@/eval/node'
import { Move } from '@/move'
import { Coord } from '@/utils/coord'
import { Chess } from './chess'

/**
 * Internal state of the sketch. Not exposed to React.
 *
 * This should be enough to render the game.
 */
export class GameState {
  /** Chess state. */
  chess: Chess

  /** Which piece is currently being dragged. */
  dragged: Coord | null = null

  /** Move delay for AI, in milliseconds. */
  static AI_MOVE_DELAY = 500

  /**
   * When was the last move made?
   *
   * If autoplay is enabled, we don't want to make the move immediately, but want to wait a little bit. Hence this variable.
   */
  lastMoveTimestamp = 0

  constructor(chess: Chess) {
    this.chess = chess
  }

  makeMove(move: Move) {
    this.chess.makeMove(move)
    this.lastMoveTimestamp = performance.now()
  }

  /** Find the best move if we don't know it already */
  updateBestMoveAndGameStatus(options: { searchDepth: number }) {
    if (this.chess.bestMove === null) {
      const startTime = performance.now()
      this.chess.search.resetNodesCounter()
      const bestMove = this.chess.search.findBestMove(
        new EvalNode(this.chess.board),
        options.searchDepth
      )
      const endTime = performance.now()
      const timeElapsed = (endTime - startTime) / 1000
      // Get the node count for NPS calculation
      // See /docs/nps.md for details on node counting and NPS calculation
      const nodesEvaluated = this.chess.search.getNodesEvaluated()
      this.chess.bestMove = {
        ...bestMove,
        time: timeElapsed,
        nodes: nodesEvaluated,
      }
      this.chess.updateGameStatus()
      console.debug('Best move', this.chess.bestMove)
    }
  }
}
