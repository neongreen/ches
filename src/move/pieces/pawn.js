// @ts-check

/** Everything related to how the pawn moves. */

/** All possible pawn moves on the board, including captures.
 *
 * TODO: en passant, promotion
 *
 * @param {Board} board
 * @param {Coord} coord
 * @returns {Move[]}
 */
function pawnMoves(board, coord) {
  const piece = board.at(coord)
  /** @type {Move[]} */
  let moves = []

  if (piece === WHITE_PAWN) {
    // going up 1 if empty
    if (board.isEmpty(coord.n()))
      moves.push({ kind: 'normal', from: coord, to: coord.n() })
    // going up 2 if empty && we are on the second rank
    if (
      coord.y === 1 &&
      board.isEmpty(coord.n()) &&
      board.isEmpty(coord.n().n())
    )
      moves.push({ kind: 'normal', from: coord, to: coord.n().n() })
    // captures if there's something to capture
    for (const target of [coord.ne(), coord.nw()]) {
      if (board.isOccupied(target) && color(board.at(target)) === BLACK)
        moves.push({ kind: 'normal', from: coord, to: target })
    }
  }

  if (piece === BLACK_PAWN) {
    // going down 1 if empty
    if (board.isEmpty(coord.s()))
      moves.push({ kind: 'normal', from: coord, to: coord.s() })
    // going down 2 if empty && we are on the seventh rank
    if (
      coord.y === 6 &&
      board.isEmpty(coord.s()) &&
      board.isEmpty(coord.s().s())
    )
      moves.push({ kind: 'normal', from: coord, to: coord.s().s() })
    // captures if there's something to capture
    for (const target of [coord.se(), coord.sw()]) {
      if (board.isOccupied(target) && color(board.at(target)) === WHITE)
        moves.push({ kind: 'normal', from: coord, to: target })
    }
  }
  return moves
}

/** Is a pawn move valid? (Does not take checks into account.)
 *
 * @param {Board} board
 * @param {Move} move
 * @returns {boolean}
 */
function isPawnMoveValid(board, move) {
  return pawnMoves(board, move.from).some(
    (m) => m.to.x === move.to.x && m.to.y === move.to.y
  )
}
