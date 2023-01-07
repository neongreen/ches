// @ts-check

/** @typedef {{kind: 'normal', from: Coord, to: Coord}} Move */

/** Game state representation. Includes pieces, whose move it is, etc. */
class Board {
  /** @type {Array<Array<string>>} */
  board

  /** Whose move it is now.
   *
   * @type {'white' | 'black'}
   */
  side

  /** Create a new board.
   *
   * By default, the board is set up in the standard chess starting position.
   */
  constructor() {
    this.board = new Array(8).fill(null).map(() => new Array(8).fill('-'))
    this.setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  }

  /** Return a copy of the board.
   *
   * @returns {Board}
   */
  clone() {
    const clone = new Board()
    clone.board = this.board.map((row) => row.slice())
    clone.side = this.side
    return clone
  }

  /**
   * Returns the piece at coordinates (x, y).
   *
   * The bottom left corner is (0, 0) and the top right corner is (7, 7).
   *
   * Pieces are represented with P, N, B, R, Q, K for white and p, n, b, r, q, k for black. If there is no piece, we return '-'.
   *
   * @param {Coord} coord
   */
  at(coord) {
    return this.board[coord.y][coord.x]
  }

  /**
   * Is a square empty? NB: returns undefined if the square is off the board.
   *
   * @param {Coord} coord
   * @returns {boolean | undefined}
   */
  isEmpty(coord) {
    if (!coord.isValid()) return undefined
    return this.at(coord) === '-'
  }

  /**
   * Is a square occupied? NB: returns undefined if the square is off the board.
   *
   * @param {Coord} coord
   * @returns {boolean | undefined}
   */
  isOccupied(coord) {
    if (!coord.isValid()) return undefined
    return this.at(coord) !== '-'
  }

  /** Set the board state, based on a FEN string.
   *
   * For example, the starting position is:
   *
   * ```
   * rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
   * ```
   */
  setFen(fen) {
    const [pieces, side, castling, enPassant, halfmove, fullmove] =
      fen.split(' ')
    this.side = side === 'w' ? 'white' : 'black'

    let rows = pieces.split('/')
    rows.reverse()
    for (let y = 0; y < 8; y++) {
      let x = 0
      for (const char of rows[y]) {
        if (char >= '1' && char <= '8') {
          x += parseInt(char)
        } else {
          this.board[y][x] = char
          x++
        }
      }
    }
  }

  /** Execute a move. Doesn't check if it's valid.
   *
   * @param {Move} move
   */
  executeMove(move) {
    this.board[move.to.y][move.to.x] = this.board[move.from.y][move.from.x]
    this.board[move.from.y][move.from.x] = '-'
    this.side = this.side === 'white' ? 'black' : 'white'
  }
}
