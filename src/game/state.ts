import { Position } from '@/board'
import { EvalNode } from '@/eval/node'
import { Move } from '@/move'
import { Color, Piece, PieceEmpty } from '@/piece'
import { Coord } from '@/utils/coord'
import { Chess } from './chess'

class SimpleBoard implements Position {
  dimensions = { width: 8, height: 8 }

  allSquares = Coord.range2(this.dimensions.width, this.dimensions.height)

  side: Color

  private pieces: { coord: Coord; piece: Piece }[]

  at(coord: Coord) {
    const x = this.pieces.find((p) => p.coord.equals(coord))
    return x ? x.piece : PieceEmpty
  }

  isEmpty(coord: Coord) {
    if (!coord.isValid()) return undefined
    return this.at(coord) === PieceEmpty
  }

  isOccupied(coord: Coord) {
    if (!coord.isValid()) return undefined
    return this.at(coord) !== PieceEmpty
  }

  constructor(side: Color, pieces: { coord: Coord; piece: Piece }[]) {
    this.side = side
    this.pieces = pieces
  }
}

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

  /** Premove queue for white. */
  premoves: { from: Coord; to: Coord }[] = []

  /** Piece position after premoves; kept in sync with `premoves` */
  shownPosition: SimpleBoard

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
    this.shownPosition = new SimpleBoard(chess.board.side, chess.board.pieces())
  }

  makeMoveWhite(move: Move) {
    if (this.chess.board.side !== Color.White) throw new Error("Not white's turn")
    if (this.premoves.length > 0) throw new Error('Cannot make a move while premoves are queued')
    this.chess.makeMove(move)
    this.lastMoveTimestamp = performance.now()
    // TODO: update shownPosition
  }

  makeMoveBlack(move: Move) {
    if (this.chess.board.side !== Color.Black) throw new Error("Not black's turn")
    this.chess.makeMove(move)
    this.lastMoveTimestamp = performance.now()
    // TODO: update shownPosition and possibly erase premoves
  }

  /** Find the best move if we don't know it already */
  updateBestMoveAndGameStatus(options: { searchDepth: number }) {
    if (this.chess.bestMove === null) {
      const startTime = performance.now()
      const bestMove = this.chess.search.findBestMove(
        new EvalNode(this.chess.board),
        options.searchDepth
      )
      this.chess.bestMove = { ...bestMove, time: (performance.now() - startTime) / 1000 }
      this.chess.updateGameStatus()
      console.debug('Best move', this.chess.bestMove)
    }
  }

  /** Piece positions after all premoves have been applied. If there are no premoves, just returns the current piece positions. */
  piecesAfterPremoves():
    | { status: 'success'; pieces: { coord: Coord; piece: Piece }[] }
    | { status: 'invalidPremoves' } {
    let pieces = this.chess.board.pieces()
    for (const premove of this.premoves) {
      const x = pieces.find((p) => p.coord.equals(premove.from))
      if (!x) return { status: 'invalidPremoves' }
      pieces = [
        ...pieces.filter((p) => !p.coord.equals(premove.from) && !p.coord.equals(premove.to)),
        { coord: premove.to, piece: x.piece },
      ]
    }
    return { status: 'success', pieces }
  }
}
