// @ts-check

/** A node in the evaluation tree. Contains a board + extra info used for eval. */
class EvalNode {
  /** The board.
   *
   * @type {Board}
   */
  board

  /** The number of points each side has. Used for evaluation.
   *
   * @type {{white: number, black: number}}
   */
  material

  /**
   *
   * @param {Board} board
   */
  constructor(board) {
    this.board = board.clone()
    this.material = {
      white: 0,
      black: 0,
    }
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const piece = board.at(new Coord(x, y))
        if (piece === EMPTY) continue
        this.material[color(piece) === WHITE ? 'white' : 'black'] +=
          piecePoints(piece)
      }
    }
  }

  /** Execute a move. Doesn't check if it's valid.
   *
   * @param {Move} move
   */
  executeMove(move) {
    const captured = this.board.at(move.to)
    if (captured !== EMPTY) {
      this.material[color(captured) === WHITE ? 'white' : 'black'] -=
        piecePoints(captured)
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
    return clone
  }
}
