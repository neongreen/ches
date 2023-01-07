/** Move generator */

// pieceColor(piece: Piece): 'white' | 'black'
function pieceColor(piece) {
  if ('A' <= piece && piece <= 'Z') return 'white'
  if ('a' <= piece && piece <= 'z') return 'black'
  return '-'
}

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
      if (pieceColor(board.at(x, y)) === board.side) {
        moves.push(...quasiLegalNormalMoves(board, { x, y }))
      }
    }
  }
  moves = moves.filter((m) => isLegalMove(board, m, { ...options, assumeQuasiLegal: true }))
  return moves
}

// Determines if the side to move is in check
function isInCheck(board) {
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      if (
        (board.side === 'white' && board.at(x, y) === 'K') ||
        (board.side === 'black' && board.at(x, y) === 'k')
      ) {
        return isAttacked(board, { x, y })
      }
    }
  }
}
