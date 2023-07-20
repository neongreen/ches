import { Board } from '@/board'
import { Move } from '@/move'
import { Color, isPawn, MaybePiece, Piece, pieceColor, PieceEmpty } from '@/piece'
import { Coord } from '@/utils/coord'
import { pieceValue } from './material'

function signed(sign: boolean, x: number) {
  return sign ? x : -x
}

const PIECE_ENTERS = true
const PIECE_LEAVES = false

/** A node in the evaluation tree. Contains a board + extra info used for eval. */
export class EvalNode {
  /**
   * The board.
   */
  board: Board

  /**
   * The number of points each side has.
   *
   * The material is calculated according to `piecePoints`.
   */
  material: { white: number; black: number }

  /**
   * How many developed pieces each side has.
   *
   * A piece is developed if it's not on its starting rank.
   */
  development: { white: number; black: number }

  /**
   * How far each side's pawns have advanced from their starting rank.
   *
   * For example, if white's e-pawn and the d-pawn have both advanced 2 squares, this would be
   * `{ white: 4, black: 0 }`.
   */
  pawnAdvancement: { white: number; black: number }

  /**
   * Things to do when a piece is lifted off, or put on the board. (Updates `material`, `development`, etc.)
   *
   * @param sign Whether the piece is being added (`PIECE_ENTERS`) or removed (`PIECE_LEAVES`).
   */
  private countPiece(piece: Piece, coord: Coord, sign: boolean) {
    switch (pieceColor(piece)) {
      case Color.White:
        {
          this.material.white += signed(sign, pieceValue(piece))
          if (isPawn(piece)) {
            this.pawnAdvancement.white += signed(sign, coord.y - 1)
          } else {
            if (coord.y !== 0) this.development.white += signed(sign, 1)
          }
        }
        break
      case Color.Black: {
        this.material.black += signed(sign, pieceValue(piece))
        if (isPawn(piece)) {
          this.pawnAdvancement.black += signed(sign, 6 - coord.y)
        } else {
          if (coord.y !== 7) this.development.black += signed(sign, 1)
        }
        break
      }
    }
  }

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
          if (piece !== PieceEmpty) this.countPiece(piece, new Coord(x, y), PIECE_ENTERS)
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
    switch (move.kind) {
      case 'normal':
        {
          const piece = this.board.at(move.from) as Piece // I swear it's not empty
          this.countPiece(piece, move.from, PIECE_LEAVES)
          this.countPiece(move.promotion || piece, move.to, PIECE_ENTERS)
          if (move.capture !== PieceEmpty) this.countPiece(move.capture, move.to, PIECE_LEAVES)
        }
        break
      case 'castling':
        {
          const king = this.board.at(move.kingFrom) as Piece
          const rook = this.board.at(move.rookFrom) as Piece
          this.countPiece(king, move.kingFrom, PIECE_LEAVES)
          this.countPiece(rook, move.rookFrom, PIECE_LEAVES)
          this.countPiece(king, move.kingTo, PIECE_ENTERS)
          this.countPiece(rook, move.rookTo, PIECE_ENTERS)
        }
        break
      case 'enPassant': {
        const pawn = this.board.at(move.from) as Piece
        this.countPiece(pawn, move.from, PIECE_LEAVES)
        this.countPiece(pawn, move.to, PIECE_ENTERS)
        this.countPiece(move.capture, move.captureCoord, PIECE_LEAVES)
      }
    }

    if (newBoard) this.board = newBoard
    else this.board.executeMove(move)
  }

  unmakeMove() {
    const move = this.board.unmakeMove()

    // Now it's the same code as in `executeMove`, but with the signs flipped
    switch (move.kind) {
      case 'normal':
        {
          const piece = this.board.at(move.from) as Piece // I swear it's not empty
          this.countPiece(piece, move.from, PIECE_ENTERS)
          this.countPiece(move.promotion || piece, move.to, PIECE_LEAVES)
          if (move.capture !== PieceEmpty) this.countPiece(move.capture, move.to, PIECE_ENTERS)
        }
        break
      case 'castling':
        {
          const king = this.board.at(move.kingFrom) as Piece
          const rook = this.board.at(move.rookFrom) as Piece
          this.countPiece(king, move.kingFrom, PIECE_ENTERS)
          this.countPiece(rook, move.rookFrom, PIECE_ENTERS)
          this.countPiece(king, move.kingTo, PIECE_LEAVES)
          this.countPiece(rook, move.rookTo, PIECE_LEAVES)
        }
        break
      case 'enPassant': {
        const pawn = this.board.at(move.from) as Piece
        this.countPiece(pawn, move.from, PIECE_ENTERS)
        this.countPiece(pawn, move.to, PIECE_LEAVES)
        this.countPiece(move.capture, move.captureCoord, PIECE_ENTERS)
      }
    }
  }

  /**
   * Return a copy of the node.
   */
  clone(): EvalNode {
    return new EvalNode(this)
  }
}
