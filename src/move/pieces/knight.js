// @ts-check

/** Everything related to how the knight moves. */

/** All possible knight moves on the board, including captures.
 *
 * @param {Board} board
 * @param {Coord} coord
 * @returns {Move[]}
 */
function knightMoves(board, coord) {
  /** @type {Move[]} */
  let moves = []
  const piece = board.at(coord)
  const deltas = [
    { x: 1, y: 2 },
    { x: 2, y: 1 },
    { x: -1, y: 2 },
    { x: -2, y: 1 },
    { x: 1, y: -2 },
    { x: 2, y: -1 },
    { x: -1, y: -2 },
    { x: -2, y: -1 },
  ]
  for (let delta of deltas) {
    const target = coord.shift(delta)
    if (target.isValid() && color(board.at(target)) !== color(piece)) {
      moves.push({ kind: 'normal', from: coord, to: target })
    }
  }
  return moves
}

/** Is a knight move valid? (Does not take checks into account.)
 *
 * @param {Board} board
 * @param {Move} move
 * @returns {boolean}
 */
function isKnightMoveValid(board, move) {
  return knightMoves(board, move.from).some((m) => _.isEqual(m, move))
}
