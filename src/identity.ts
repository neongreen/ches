import { Board } from './board'
import { Move, getAllMovers, getCapture } from './move'
import { Piece } from './piece'
import { Coord } from './utils/coord'

/** A class to keep track of piece identity. */
export class Identity {
  /** Each piece is numbered by its original position. */
  private pieces: { coord: Coord; originalPiece: Piece; id: number }[]

  constructor(board: Board) {
    this.pieces = board.pieces().map((x, i) => ({ coord: x.coord, originalPiece: x.piece, id: i }))
  }

  /** Get the id of a piece. */
  getByCoord(coord: Coord): { coord: Coord; originalPiece: Piece; id: number } | undefined {
    return this.pieces.find((x) => x.coord.equals(coord))
  }

  /** Where is the piece located now? */
  getById(id: number): { coord: Coord; originalPiece: Piece; id: number } | undefined {
    return this.pieces.find((x) => x.id === id)
  }

  /** Update after a move. */
  makeMove(boardBeforeMove: Board, move: Move) {
    const capture = getCapture(move)
    if (capture) {
      this.pieces = this.pieces.filter((x) => !x.coord.equals(capture.victim))
    }
    for (const mover of getAllMovers(boardBeforeMove, move)) {
      const x = this.getByCoord(mover.from)
      if (!x) continue
      x.coord = mover.to
    }
  }

  clone(): Identity {
    const x = new Identity(new Board())
    x.pieces = this.pieces.map((x) => ({ ...x }))
    return x
  }
}
