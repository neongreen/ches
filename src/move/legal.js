// @ts-check

/** A module containing functions that exactly determine if a move is legal. */

/**

  isLegalMove( 
   pos: Position,
   move: Move,
   options: {
     // Allow king captures and moving when in check
     ignoreCheck: boolean,
     // Ignore checks that 'quasiLegalNormalMoves' already does
     assumeQuasiLegal: boolean,
   }
  ): boolean

  @param {Board} board
  @param {Move} move
*/
function isLegalMove(board, move, options) {
  if (!options.assumeQuasiLegal)
    throw new Error('isLegalMove: assumeQuasiLegal is currently required')
  if (move.kind === 'normal') {
    // No moving outside the board boundaries
    if (!move.from.isValid() || !move.to.isValid()) return false

    // Can't stay on the same spot
    if (move.from.x === move.to.x && move.from.y === move.to.y) return false

    const from = board.at(move.from)
    const to = board.at(move.to)

    // The piece has to be there
    if (from === '-') return false

    // Taking your own pieces is not allowed
    if (pieceColor(from) === pieceColor(to)) return false

    if (!options || !options.ignoreCheck) {
      // Taking a king is not allowed
      if (to.toLowerCase() === 'k') return false

      // The side to move must not be in check after the move
      let newBoard = board.clone()
      newBoard.executeMove(move)
      newBoard.side = invertColor(newBoard.side)
      if (isInCheck(newBoard)) return false
    }

    if (!options || !options.assumeQuasiLegal) {
      // TODO: movement rules
    }

    // TODO: en passant rules

    return true
  }

  // TODO castling

  // TODO promotion
}
