// @ts-check

/**
 * @param {Piece} piece
 */
function piecePoints(piece) {
  if (isPawn(piece)) return 1
  if (isKnight(piece)) return 3
  if (isBishop(piece)) return 3
  if (isRook(piece)) return 5
  if (isQueen(piece)) return 9
  if (isKing(piece)) return 4
  return 0
}
