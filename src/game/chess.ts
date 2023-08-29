import { Board } from '@/board'
import { Challenge } from '@/challenges/core'
import { Score } from '@/eval/score'
import { Search } from '@/eval/search'
import { Move } from '@/move'
import { legalMoves_slow } from '@/move/legal'
import { Color } from '@/piece'
import _ from 'lodash'

export class Chess {
  board = new Board()

  search = new Search()

  challenge: Challenge | null = null

  isMoveAllowedByChallenge: (move: Move) => boolean = () => true

  gameStatus:
    | { status: 'playing' }
    | { status: 'won'; reason: 'checkmate' }
    | { status: 'lost'; reason: 'checkmate' | 'challengeFailed' | 'challengeNoMovesAvailable' }
    | { status: 'draw'; reason: 'threefoldRepetition' | 'other' }

  bestMove: {
    move: Move | null
    score: Score // The score (eval) of the best move
    time: number // How much time was spent on the eval
    line: Move[]
  } | null = null

  history: { boardBeforeMove: Board; move: Move }[] = []

  /**
   * Make a challenge move decider, based on the current challenge and current history.
   *
   * You can use the returned function to quickly check if a move is allowed by the challenge. The returned function is only valid for the current state of the game.
   */
  private makeChallengeMoveDecider(): (move: Move) => boolean {
    const challenge = this.challenge
    if (!challenge) return () => true
    const obj = {
      currentFullMoveNumber: Math.floor(this.history.length / 2) + 1,
      currentHalfMoveNumber: this.history.length + 1,
      history: this.history,
      board: this.board,
    }
    return (move: Move) => challenge.isMoveAllowed({ ...obj, move })
  }

  lastMove(): Move | null {
    return _.last(this.history)?.move ?? null
  }

  /** Make a move (assuming it's already been checked for legality) */
  makeMove(move: Move) {
    const boardBeforeMove = this.board.clone()
    this.board.executeMove(move)
    this.bestMove = null
    this.history.push({ boardBeforeMove, move })
    this.challenge?.recordMove?.({
      move,
      side: boardBeforeMove.side,
      boardBeforeMove,
      boardAfterMove: this.board,
      history: this.history,
    })
    this.isMoveAllowedByChallenge = this.makeChallengeMoveDecider()
  }

  /** Update game status if `bestMove` is already available */
  updateGameStatus() {
    if (this.bestMove === null) return

    const legalMoves = legalMoves_slow(this.board)
    const legalMovesAfterChallenge = legalMoves.filter(this.isMoveAllowedByChallenge)
    if (this.challenge?.isChallengeLost?.({ board: this.board }).lost ?? false) {
      this.gameStatus = { status: 'lost', reason: 'challengeFailed' }
    } else if (this.bestMove.move === null && this.bestMove.score > 0) {
      this.gameStatus = { status: 'won', reason: 'checkmate' }
    } else if (this.bestMove.move === null && this.bestMove.score < 0) {
      this.gameStatus = { status: 'lost', reason: 'checkmate' }
    } else if (this.bestMove.move === null && this.bestMove.score === 0) {
      this.gameStatus = {
        status: 'draw',
        reason: this.board.isThreefoldRepetition() ? 'threefoldRepetition' : 'other',
      }
    } else if (
      this.board.side === Color.White &&
      legalMoves.length > 0 &&
      legalMovesAfterChallenge.length === 0
    ) {
      this.gameStatus = { status: 'lost', reason: 'challengeNoMovesAvailable' }
    }
  }

  constructor(options: { challenge: Challenge | null }) {
    this.challenge = options.challenge
    this.isMoveAllowedByChallenge = this.makeChallengeMoveDecider()
    this.gameStatus = { status: 'playing' }
  }
}
