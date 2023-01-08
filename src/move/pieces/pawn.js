// @ts-check

/** Everything related to how the pawn moves. */

/** All possible pawn moves on the board, including captures.
 *
 * TODO: en passant, promotion to pieces other than queen
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
    {
      const dest = coord.n()
      if (board.isEmpty(dest))
        moves.push({
          kind: 'normal',
          from: coord,
          to: dest,
          ...(dest.y === 7 ? { promotion: WHITE_QUEEN } : {}),
        })
    }

    // going up 2 if empty && we are on the second rank
    if (
      coord.y === 1 &&
      board.isEmpty(coord.n()) &&
      board.isEmpty(coord.n().n())
    ) {
      moves.push({ kind: 'normal', from: coord, to: coord.n().n() })
    }

    // captures if there's something to capture
    for (const dest of [coord.ne(), coord.nw()]) {
      if (board.isOccupied(dest) && color(board.at(dest)) === BLACK)
        moves.push({
          kind: 'normal',
          from: coord,
          to: dest,
          ...(dest.y === 7 ? { promotion: WHITE_QUEEN } : {}),
        })
    }
  }

  if (piece === BLACK_PAWN) {
    // going down 1 if empty
    {
      const dest = coord.s()
      if (board.isEmpty(dest))
        moves.push({
          kind: 'normal',
          from: coord,
          to: dest,
          ...(dest.y === 0 ? { promotion: BLACK_QUEEN } : {}),
        })
    }

    // going down 2 if empty && we are on the seventh rank
    if (
      coord.y === 6 &&
      board.isEmpty(coord.s()) &&
      board.isEmpty(coord.s().s())
    ) {
      moves.push({ kind: 'normal', from: coord, to: coord.s().s() })
    }

    // captures if there's something to capture
    for (const dest of [coord.se(), coord.sw()]) {
      if (board.isOccupied(dest) && color(board.at(dest)) === WHITE)
        moves.push({
          kind: 'normal',
          from: coord,
          to: dest,
          ...(dest.y === 0 ? { promotion: BLACK_QUEEN } : {}),
        })
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
  return pawnMoves(board, move.from).some((m) => _.isEqual(m, move))
}
