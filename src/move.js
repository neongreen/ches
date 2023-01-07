// @ts-check

/**
 * @param {string} piece
 * @returns {'white' | 'black' | '-'}
 */
function pieceColor(piece) {
  if ('A' <= piece && piece <= 'Z') return 'white'
  if ('a' <= piece && piece <= 'z') return 'black'
  return '-'
}

/**
 * @param {'white' | 'black'} color
 * @returns {'white' | 'black'}
 */
function invertColor(color) {
  if (color === 'white') return 'black'
  else return 'white'
}

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
      if (pieceColor(board.at(coord)) === board.side) {
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
      if (
        (board.side === 'white' && board.at(coord) === 'K') ||
        (board.side === 'black' && board.at(coord) === 'k')
      ) {
        return isAttacked(board, coord)
      }
    }
  }
  return false
}
