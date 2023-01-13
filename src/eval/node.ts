import { Board } from '@/board'
import { Move } from '@/move'
import { Color, colorName, isPawn, Piece, pieceColor } from '@/piece'
import { Coord } from '@/utils/coord'
import { piecePoints } from './material'
import { match } from 'ts-pattern'

/** A node in the evaluation tree. Contains a board + extra info used for eval. */
export class EvalNode {
  /**
   * The board.
   */
  board: Board

  /**
   * The number of points each side has.
   */
  material: { white: number; black: number }

  /**
   * How many developed pieces each side has.
   *
   * A piece is developed if it's not on the first/last rank.
   */
  development: { white: number; black: number }

  constructor(node: EvalNode)
  constructor(board: Board)
  constructor(nodeOrBoard: EvalNode | Board) {
    if (nodeOrBoard instanceof Board) {
      // Create a new node from a board
      const board = nodeOrBoard
      this.board = board.clone()
      this.material = { white: 0, black: 0 }
      this.development = { white: 0, black: 0 }
      for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
          const piece = board.at(new Coord(x, y))
          if (piece === Piece.Empty) continue
          this.material[colorName(piece)] += piecePoints(piece)
          if (pieceColor(piece) === Color.White && !isPawn(piece) && y !== 0)
            this.development.white++
          if (pieceColor(piece) === Color.Black && !isPawn(piece) && y !== 7)
            this.development.black++
        }
      }
    } else {
      // Clone a node
      const node = nodeOrBoard
      this.board = node.board.clone()
      this.material = { ...node.material }
      this.development = { ...node.development }
    }
  }

  /**
   * Execute a move. Doesn't check if it's valid.
   */
  executeMove(move: Move) {
    match(move)
      .with({ kind: 'normal' }, (move) => {
        const piece = this.board.at(move.from)
        const dest = this.board.at(move.to)

        // If we have captured a piece, update the material score and development
        if (dest !== Piece.Empty) {
          this.material[colorName(dest)] -= piecePoints(dest)
          if (!isPawn(dest)) {
            if (pieceColor(dest) === Color.White && move.to.y !== 0) this.development.white--
            if (pieceColor(dest) === Color.Black && move.to.y !== 7) this.development.black--
          }
        }

        // If the moved piece (not a pawn) was undeveloped and became developed, or vice-versa:
        if (!isPawn(piece)) {
          if (pieceColor(piece) === Color.White) {
            if (move.from.y !== 0) this.development.white--
            if (move.to.y !== 0) this.development.white++
          }
          if (pieceColor(piece) === Color.Black) {
            if (move.from.y !== 7) this.development.black--
            if (move.to.y !== 7) this.development.black++
          }
        }

        // If the moved piece *was* a pawn but became promoted:
        if (isPawn(piece) && move.promotion) {
          this.material[colorName(piece)] -= 1
          this.material[colorName(piece)] += piecePoints(move.promotion)
          this.development[colorName(piece)]++
        }
      })
      .with({ kind: 'castling' }, (move) => {
        // Neither development nor material changes
      })
      .exhaustive()

    this.board.executeMove(move)
  }

  /**
   * Return a copy of the node.
   */
  clone(): EvalNode {
    return new EvalNode(this)
  }
}
