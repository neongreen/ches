// @ts-check

/** Everything related to how the queen moves. */

/** Squares that a queen passes between points A and B (not including either of those).
 *
 * @param {Coord} a
 * @param {Coord} b
 * @returns {Coord[] | undefined}
 */
function queenPath(a, b) {
  if (a.x === b.x || a.y === b.y) {
    return rookPath(a, b)
  } else if (a.x - a.y === b.x - b.y || a.x + a.y === b.x + b.y) {
    return bishopPath(a, b)
  } else {
    return undefined
  }
}

/** All possible queen moves on the board, including captures.
 *
 * @param {Board} board
 * @param {Coord} coord
 * @returns {Move[]}
 */
function queenMoves(board, coord) {
  return [...rookMoves(board, coord), ...bishopMoves(board, coord)]
}

/** Is a queen move valid? (Does not take checks into account.)
 *
 * @param {Board} board
 * @param {Move} move
 * @returns {boolean}
 */
function isQueenMoveValid(board, move) {
  const path = queenPath(move.from, move.to)
  return (
    path !== undefined &&
    path.every((coord) => board.isEmpty(coord)) &&
    (board.isEmpty(move.to) ||
      color(board.at(move.from)) !== color(board.at(move.to)))
  )
}
