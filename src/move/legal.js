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

*/
function isLegalMove(pos, move, options) {
  if (!options.assumeQuasiLegal)
    throw new Error("isLegalMove: assumeQuasiLegal is currently required");
  if (move.kind === "normal") {
    // No moving outside the board boundaries
    if (
      move.from.x < 0 ||
      move.from.x >= 8 ||
      move.from.y < 0 ||
      move.from.y >= 8 ||
      move.to.x < 0 ||
      move.to.x >= 8 ||
      move.to.y < 0 ||
      move.to.y >= 8
    )
      return false;

    // Can't stay on the same spot
    if (move.from.x === move.to.x && move.from.y === move.to.y) return false;

    const from = pos.board[move.from.y][move.from.x];
    const to = pos.board[move.to.y][move.to.x];

    const newPos = executeMove(pos, move);

    // The piece has to be there
    if (from === "-") return false;

    // Taking your own pieces is not allowed
    if (pieceColor(from) === pieceColor(to)) return false;

    if (!options || !options.ignoreCheck) {
      // Taking a king is not allowed
      if (to.toLowerCase() === "k") return false;
      // The side to move must not be in check after the move
      if (isInCheck({ ...newPos, side: pos.side })) return false;
    }

    if (!options || !options.assumeQuasiLegal) {
      // TODO: movement rules
    }

    // TODO: en passant rules

    return true;
  }

  // TODO castling

  // TODO promotion
}