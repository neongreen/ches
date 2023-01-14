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
   *
   * The material is calculated with `piecePoints`.
   */
  material: { white: number; black: number }

  /**
   * How many developed pieces each side has.
   *
   * A piece is developed if it's not on the first/last rank.
   */
  development: { white: number; black: number }

  /**
   * How far each side's pawns have advanced from their starting rank.
   *
   * For example, if white's e-pawn and the d-pawn have both advanced 2 squares, this would be
   * `{ white: 4, black: 0 }`.
   */
  pawnAdvancement: { white: number; black: number }

  constructor(node: EvalNode)
  constructor(board: Board)
  constructor(nodeOrBoard: EvalNode | Board) {
    if (nodeOrBoard instanceof Board) {
      // Create a new node from a board
      const board = nodeOrBoard
      this.board = board.clone()
      this.material = { white: 0, black: 0 }
      this.development = { white: 0, black: 0 }
      this.pawnAdvancement = { white: 0, black: 0 }
      for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
          const piece = board.unsafeAt(new Coord(x, y))
          if (piece === Piece.Empty) continue
          this.material[colorName(piece)] += piecePoints(piece)
          if (isPawn(piece)) {
            // For pawns we count 'pawnAdvancement'
            if (pieceColor(piece) === Color.White) this.pawnAdvancement.white += y - 1
            else this.pawnAdvancement.black += 6 - y
          } else {
            // For pieces we count 'development'
            if (pieceColor(piece) === Color.White && y !== 0) {
              this.development.white++
            } else if (pieceColor(piece) === Color.Black && y !== 7) {
              this.development.black++
            }
          }
        }
      }
    } else {
      // Clone a node
      const node = nodeOrBoard
      this.board = node.board.clone()
      this.material = { ...node.material }
      this.development = { ...node.development }
      this.pawnAdvancement = { ...node.pawnAdvancement }
    }
  }

  /**
   * Execute a move. Doesn't check if it's valid.
   *
   * @param newBoard The result of `Board.executeMove()`, if already calculated.
   */
  executeMove(move: Move, newBoard?: Board) {
    match(move)
      .with({ kind: 'normal' }, (move) => {
        const piece = this.board.at(move.from)
        const dest = this.board.at(move.to)

        // If we have captured a piece, update the material score and development
        if (dest !== Piece.Empty) {
          this.material[colorName(dest)] -= piecePoints(dest)
          if (isPawn(dest)) {
            if (pieceColor(dest) === Color.White) this.pawnAdvancement.white -= move.to.y - 1
            if (pieceColor(dest) === Color.Black) this.pawnAdvancement.black -= 6 - move.to.y
          } else {
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

        // If the moved piece was a pawn:
        if (isPawn(piece)) {
          if (move.promotion) {
            this.material[colorName(piece)] += piecePoints(move.promotion) - 1
            this.development[colorName(piece)]++
            this.pawnAdvancement[colorName(piece)] -= 5 // T R U S T
          } else {
            if (pieceColor(piece) === Color.White) {
              this.pawnAdvancement.white += move.to.y - move.from.y
            } else {
              this.pawnAdvancement.black += move.from.y - move.to.y
            }
          }
        }
      })
      .with({ kind: 'castling' }, (move) => {
        // Neither development nor material changes
      })
      .exhaustive()

    if (newBoard) this.board = newBoard
    else this.board.executeMove(move)
  }

  /**
   * Return a copy of the node.
   */
  clone(): EvalNode {
    return new EvalNode(this)
  }
}
