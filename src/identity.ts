import { Board } from './board'
import { Move, getAllMovers, getCapture } from './move'
import { Coord } from './utils/coord'

/** A class to keep track of piece identity. */
export class Identity {
  /** Each piece is numbered by its original position. */
  private pieces: { coord: Coord; id: number }[]

  constructor(board: Board) {
    this.pieces = board.pieces().map((x, i) => ({ coord: x.coord, id: i }))
  }

  /** Get the id of a piece. */
  getByCoord(coord: Coord): { coord: Coord; id: number } | undefined {
    return this.pieces.find((x) => x.coord.equals(coord))
  }

  /** Where is the piece located now? */
  getById(id: number): { coord: Coord; id: number } | undefined {
    return this.pieces.find((x) => x.id === id)
  }

  /** Update after a move. */
  makeMove(boardBeforeMove: Board, move: Move) {
    for (const mover of getAllMovers(boardBeforeMove, move)) {
      const x = this.getByCoord(mover.from)
      if (!x) continue
      x.coord = mover.to
    }
    const capture = getCapture(move)
    if (capture) {
      this.pieces = this.pieces.filter((x) => !x.coord.equals(capture.victim))
    }
  }

  clone(): Identity {
    const x = new Identity(new Board())
    x.pieces = this.pieces.map((x) => ({ ...x }))
    return x
  }
}
