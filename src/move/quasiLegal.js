// @ts-check

/** Generates possible moves for a specific piece based on how pieces move, but without advanced checks like "is the king in check?"
 *
 * @param {Board} board
 * @param {Coord} coord
 * @returns {Move[]}
 */
function quasiLegalNormalMoves(board, coord) {
  const piece = board.at(coord)
  if (isPawn(piece)) return pawnMoves(board, coord)
  if (isBishop(piece)) return bishopMoves(board, coord)
  if (isKnight(piece)) return knightMoves(board, coord)
  if (isRook(piece)) return rookMoves(board, coord)
  if (isQueen(piece)) return queenMoves(board, coord)
  if (isKing(piece)) return kingMoves(board, coord)
  return []
}
