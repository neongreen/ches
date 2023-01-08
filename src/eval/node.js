// @ts-check

/** A node in the evaluation tree. Contains a board + extra info used for eval. */
class EvalNode {
  /** The board.
   *
   * @type {Board}
   */
  board

  /** The number of points each side has.
   *
   * @type {{white: number, black: number}}
   */
  material

  /** How many developed pieces each side has. A piece is developed if it's not
   * on the first/last rank.
   *
   * @type {{white: number, black: number}}
   */
  development

  /**
   *
   * @param {Board} board
   */
  constructor(board) {
    this.board = board.clone()
    this.material = { white: 0, black: 0 }
    this.development = { white: 0, black: 0 }
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const piece = board.at(new Coord(x, y))
        if (piece === EMPTY) continue
        this.material[colorName(piece)] += piecePoints(piece)
        if (color(piece) === WHITE && !isPawn(piece) && y !== 0)
          this.development.white++
        if (color(piece) === BLACK && !isPawn(piece) && y !== 7)
          this.development.black++
      }
    }
  }

  /** Execute a move. Doesn't check if it's valid.
   *
   * @param {Move} move
   */
  executeMove(move) {
    const piece = this.board.at(move.from)
    const dest = this.board.at(move.to)

    // If we have captured a piece, update the material score and development
    if (dest !== EMPTY) {
      this.material[colorName(dest)] -= piecePoints(dest)
      if (!isPawn(dest)) {
        if (color(dest) === WHITE && move.to.y !== 0) this.development.white--
        if (color(dest) === BLACK && move.to.y !== 7) this.development.black--
      }
    }

    // If the moved piece (not a pawn) was undeveloped and became developed, or vice-versa:
    if (!isPawn(piece)) {
      if (color(piece) === WHITE) {
        if (move.from.y !== 0) this.development.white--
        if (move.to.y !== 0) this.development.white++
      }
      if (color(piece) === BLACK) {
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

    this.board.executeMove(move)
  }

  /** Return a copy of the node.
   *
   * @returns {EvalNode}
   */
  clone() {
    const clone = new EvalNode(this.board.clone())
    clone.material = { ...this.material }
    clone.development = { ...this.development }
    return clone
  }
}
