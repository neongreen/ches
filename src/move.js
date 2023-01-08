// @ts-check

/** @typedef {{kind: 'normal', from: Coord, to: Coord, promotion?: Piece}} Move */

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

/** Render a move in algebraic notation.
 *
 * @param {Board} board
 * @param {Move} move
 * @returns {string}
 */
function notateMove(board, move) {
  const algebraicCoord = (coord) => {
    return String.fromCharCode('a'.charCodeAt(0) + coord.x) + (coord.y + 1)
  }

  const pieceFrom = board.at(move.from)
  const pieceTo = board.at(move.to)

  if (isPawn(pieceFrom)) {
    let notation = ''
    if (pieceTo !== EMPTY) notation += algebraicCoord(move.from).charAt(0) + 'x'
    notation += algebraicCoord(move.to)
    if (move.promotion)
      notation += '=' + pieceToLetter(move.promotion).toUpperCase()
    return notation
  }
  if (isKnight(pieceFrom)) {
    return 'N' + (pieceTo === EMPTY ? '' : 'x') + algebraicCoord(move.to)
  }
  if (isBishop(pieceFrom)) {
    return 'B' + (pieceTo === EMPTY ? '' : 'x') + algebraicCoord(move.to)
  }
  if (isRook(pieceFrom)) {
    return 'R' + (pieceTo === EMPTY ? '' : 'x') + algebraicCoord(move.to)
  }
  if (isQueen(pieceFrom)) {
    return 'Q' + (pieceTo === EMPTY ? '' : 'x') + algebraicCoord(move.to)
  }
  if (isKing(pieceFrom)) {
    return 'K' + (pieceTo === EMPTY ? '' : 'x') + algebraicCoord(move.to)
  }
  throw new Error('Unknown piece type')
}

/** Render all moves in a line in algebraic notation.
 *
 * @param {Board} board
 * @param {Move[]} line
 * @returns {string[]}
 */
function notateLine(board, line) {
  const board_ = board.clone()
  const result = []
  for (const move of line) {
    result.push(notateMove(board_, move))
    board_.executeMove(move)
  }
  return result
}
