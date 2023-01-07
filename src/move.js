// @ts-check

/**
  generateMoves(pos: Position, options: {
    // Allow all normal moves even if the side to move is in check
    ignoreCheck: boolean
  }): ...

  @param {Board} board
  @param {any} [options]
  @returns {Move[]}
*/
function generateMoves(board, options) {
  let moves = []
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      const coord = new Coord(x, y)
      if (color(board.at(coord)) === board.side) {
        moves.push(...quasiLegalNormalMoves(board, coord))
      }
    }
  }
  moves = moves.filter((m) =>
    isLegalMove(board, m, { ...options, assumeQuasiLegal: true })
  )
  return moves
}

/** Determines if the side to move is in check.
 *
 * @param {Board} board
 */
function isInCheck(board) {
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      const coord = new Coord(x, y)
      const piece = board.at(coord)
      if (isKing(piece) && board.side === color(piece)) {
        // We found the king
        return isAttacked(board, coord)
      }
    }
  }
  return false
}
