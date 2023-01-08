// @ts-check

/** Game state representation. Includes pieces, whose move it is, etc. */
class Board {
  /** @type {Piece[]} */
  board

  /** Whose move it is now.
   *
   * @type {Color}
   */
  side

  /** Create a new board.
   *
   * By default, the board is set up in the standard chess starting position.
   */
  constructor() {
    this.board = new Array(64).fill(EMPTY)
    this.setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  }

  /** Return a copy of the board.
   *
   * @returns {Board}
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
   * If the coordinates are off the board, returns EMPTY.
   *
   * @param {Coord} coord
   * @returns {Piece}
   */
  at(coord) {
    if (!coord.isValid()) return EMPTY
    return this.board[coord.y * 8 + coord.x]
  }

  /** Set the piece at coordinates (x, y).
   *
   * @param {Coord} coord
   * @param {Piece} piece
   */
  setAt(coord, piece) {
    this.board[coord.y * 8 + coord.x] = piece
  }

  /**
   * Is a square empty? NB: returns undefined if the square is off the board.
   *
   * @param {Coord} coord
   * @returns {boolean | undefined}
   */
  isEmpty(coord) {
    if (!coord.isValid()) return undefined
    return this.at(coord) === EMPTY
  }

  /**
   * Is a square occupied? NB: returns undefined if the square is off the board.
   *
   * @param {Coord} coord
   * @returns {boolean | undefined}
   */
  isOccupied(coord) {
    if (!coord.isValid()) return undefined
    return this.at(coord) !== EMPTY
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
    this.side = side === 'w' ? WHITE : BLACK
    this.board = new Array(64).fill(EMPTY)

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

  /** Execute a move. Doesn't check if it's valid.
   *
   * @param {Move} move
   */
  executeMove(move) {
    this.setAt(move.to, move.promotion ? move.promotion : this.at(move.from))
    this.setAt(move.from, EMPTY)
    this.side = this.side === WHITE ? BLACK : WHITE
  }
}
