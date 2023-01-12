import { Color, letterToPiece, Piece } from '@/piece'
import { Coord } from '@/utils/coord'
import { Move } from './move'

/** Game state representation. Includes pieces, whose move it is, etc. */
export class Board {
  board: Piece[]

  /**
   * Whose move it is now.
   */
  side: Color

  /**
   * Create a new board.
   *
   * By default, the board is set up in the standard chess starting position.
   */
  constructor() {
    this.board = new Array(64).fill(Piece.Empty)
    this.side = Color.White
    this.setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  }

  /**
   * Return a copy of the board.
   */
  clone() {
    const clone = new Board()
    clone.board = this.board.slice()
    clone.side = this.side
    return clone
  }

  /**
   * Returns the piece at coordinates (x, y).
   *
   * The bottom left corner is (0, 0) and the top right corner is (7, 7).
   *
   * If the coordinates are off the board, returns Piece.Empty.
   */
  at(coord: Coord): Piece {
    if (!coord.isValid()) return Piece.Empty
    return this.board[coord.y * 8 + coord.x]
  }

  /**
   * Set the piece at coordinates (x, y).
   */
  setAt(coord: Coord, piece: Piece) {
    this.board[coord.y * 8 + coord.x] = piece
  }

  /**
   * Is a square empty? NB: returns undefined if the square is off the board.
   */
  isEmpty(coord: Coord): boolean | undefined {
    if (!coord.isValid()) return undefined
    return this.at(coord) === Piece.Empty
  }

  /**
   * Is a square occupied? NB: returns undefined if the square is off the board.
   */
  isOccupied(coord: Coord): boolean | undefined {
    if (!coord.isValid()) return undefined
    return this.at(coord) !== Piece.Empty
  }

  /**
   * Set the board state, based on a FEN string.
   *
   * For example, the starting position is:
   *
   * ```
   * rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
   * ```
   */
  setFen(fen: string) {
    const [pieces, side, castling, enPassant, halfmove, fullmove] =
      fen.split(' ')
    this.side = side === 'w' ? Color.White : Color.Black
    this.board = new Array(64).fill(Piece.Empty)

    let rows = pieces.split('/')
    rows.reverse()
    for (let y = 0; y < 8; y++) {
      let x = 0
      for (const char of rows[y]) {
        if (char >= '1' && char <= '8') {
          x += parseInt(char)
        } else {
          this.setAt(new Coord(x, y), letterToPiece(char))
          x++
        }
      }
    }
  }

  /**
   * Execute a move. Doesn't check if it's valid.
   */
  executeMove(move: Move) {
    this.setAt(move.to, move.promotion ? move.promotion : this.at(move.from))
    this.setAt(move.from, Piece.Empty)
    this.side = this.side === Color.White ? Color.Black : Color.White
  }
}
