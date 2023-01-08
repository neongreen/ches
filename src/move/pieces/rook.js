// @ts-check

/** Everything related to how the rook moves. */

/** Squares that a rook passes between points A and B (not including either of those).
 *
 * @param {Coord} a
 * @param {Coord} b
 * @returns {Coord[] | undefined}
 */
function rookPath(a, b) {
  if (a.x === b.x) {
    return squaresBetween(a, b, { x: 0, y: a.y < b.y ? 1 : -1 })
  } else if (a.y === b.y) {
    return squaresBetween(a, b, { x: a.x < b.x ? 1 : -1, y: 0 })
  } else {
    return undefined
  }
}

/** All possible rook moves on the board, including captures.
 *
 * @param {Board} board
 * @param {Coord} coord
 * @returns {Move[]}
 */
function rookMoves(board, coord) {
  /** @type {Move[]} */
  let moves = []
  const piece = board.at(coord)
  const deltas = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
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

/** Is a rook move valid? (Does not take checks into account.)
 *
 * @param {Board} board
 * @param {Move} move
 * @returns {boolean}
 */
function isRookMoveValid(board, move) {
  const path = rookPath(move.from, move.to)
  return (
    path !== undefined &&
    path.every((coord) => board.isEmpty(coord)) &&
    (board.isEmpty(move.to) ||
      color(board.at(move.from)) !== color(board.at(move.to)))
  )
}
