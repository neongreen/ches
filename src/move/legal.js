// @ts-check

/** Exactly determines if a move is legal.
 *
 * Options:
 *   - `ignoreCheck`: Allow king captures and moving when in check
 *   - `assumeQuasiLegal`: Ignore checks that `quasiLegalNormalMoves` already does
 *
 * @param {Board} board
 * @param {Move} move
 * @param {{ ignoreCheck?: boolean, assumeQuasiLegal?: boolean }} [options]
 * @returns {boolean}
 */
function isLegalMove(board, move, options) {
  const optIgnoreCheck = options && options.ignoreCheck
  const optAssumeQuasiLegal = options && options.assumeQuasiLegal

  if (move.kind === 'normal') {
    const from = board.at(move.from)
    const to = board.at(move.to)

    // If we aren't ignoring check rules:
    //   - Taking a king is not allowed
    //   - The side to move must not be in check after the move
    if (!optIgnoreCheck) {
      if (isKing(to)) return false
      let newBoard = board.clone()
      newBoard.executeMove(move)
      newBoard.side = newBoard.side === WHITE ? BLACK : WHITE
      if (isInCheck(newBoard)) return false
    }

    // If we can't rely on the move being quasi-legal (e.g. when we are checking
    // a move that a human player wants to make), we have to be more thorough:
    if (!optAssumeQuasiLegal) {
      // No moving outside the board boundaries
      if (!move.from.isValid() || !move.to.isValid()) return false

      // Can't stay in the same spot
      if (move.from.x === move.to.x && move.from.y === move.to.y) return false

      // The 'from' piece has to be there
      if (from === EMPTY) return false

      // Capturing your own pieces is not allowed
      if (color(from) === color(to)) return false

      // Piece movement rules
      if (isPawn(from) && !isPawnMoveValid(board, move)) return false
      if (isKnight(from) && !isKnightMoveValid(board, move)) return false
      if (isBishop(from) && !isBishopMoveValid(board, move)) return false
      if (isRook(from) && !isRookMoveValid(board, move)) return false
      if (isQueen(from) && !isQueenMoveValid(board, move)) return false
      if (isKing(from) && !isKingMoveValid(board, move)) return false
    }
  }

  return true
}
