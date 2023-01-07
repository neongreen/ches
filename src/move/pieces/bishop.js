// @ts-check

/** Everything related to how the bishop moves. */

/** Squares that a bishop passes between points A and B (not including either of those).
 *
 * @param {Coord} a
 * @param {Coord} b
 * @returns {Coord[]}
 */
function bishopPath(a, b) {
  if (Math.abs(a.x - b.x) === Math.abs(a.y - b.y)) {
    return squaresBetween(a, b, {
      x: a.x < b.x ? 1 : -1,
      y: a.y < b.y ? 1 : -1,
    })
  } else {
    throw new Error('Not a bishop move')
  }
}

/** All possible bishop moves on the board, including captures.
 *
 * @param {Board} board
 * @param {Coord} coord
 * @returns {Move[]}
 */
function bishopMoves(board, coord) {
  /** @type {Move[]} */
  let moves = []
  const piece = board.at(coord)
  const deltas = [
    { x: 1, y: 1 },
    { x: -1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: -1 },
  ]
  for (let delta of deltas) {
    let xy = coord.shift(delta)
    while (board.isEmpty(xy)) {
      moves.push({ kind: 'normal', from: coord, to: xy })
      xy = xy.shift(delta)
    }
    if (board.isOccupied(xy) && color(board.at(xy)) !== color(piece)) {
      moves.push({ kind: 'normal', from: coord, to: xy })
    }
  }
  return moves
}

/** Is a bishop move valid? (Does not take checks into account.)
 *
 * @param {Board} board
 * @param {Move} move
 * @returns {boolean}
 */
function isBishopMoveValid(board, move) {
  return (
    bishopPath(move.from, move.to).every((coord) => board.isEmpty(coord)) &&
    (board.isEmpty(move.to) ||
      color(board.at(move.from)) !== color(board.at(move.to)))
  )
}
