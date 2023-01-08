// @ts-check

/** Everything related to how the king moves. */

/** All possible king moves on the board, including captures.
 *
 * TODO: castling
 *
 * @param {Board} board
 * @param {Coord} coord
 * @returns {Move[]}
 */
function kingMoves(board, coord) {
  /** @type {Move[]} */
  let moves = []
  const piece = board.at(coord)
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      if (x === 0 && y === 0) continue
      const target = coord.shift({ x, y })
      if (target.isValid() && color(board.at(target)) !== color(piece)) {
        moves.push({ kind: 'normal', from: coord, to: target })
      }
    }
  }
  return moves
}

/** Is a king move valid? (Does not take checks into account.)
 *
 * @param {Board} board
 * @param {Move} move
 * @returns {boolean}
 */
function isKingMoveValid(board, move) {
  return kingMoves(board, move.from).some((m) => _.isEqual(m, move))
}
