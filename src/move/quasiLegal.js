// @ts-check

/** A module for generating all quasi-legal moves.

Checks we do:
  - no leaping through other pieces
  - can only capture your opponent's pieces, not your own

Checks we *don't* do:
  - moving out of board boundaries
  - king check stuff
  
Moves we are currently entirely ignoring:
  - en passant
  - castling

*/

/**
 *
 * @param {Board} board
 * @param {{x: number, y: number}} pawn
 * @returns
 */
function pawnQuasiLegalMoves(board, { x, y }) {
  const piece = board.at(x, y)
  let moves = []
  if (piece === 'P') {
    // going up 1 if empty
    if (y < 7 && board.at(x, y + 1) === '-')
      moves.push({ kind: 'normal', from: { x, y }, to: { x, y: y + 1 } })
    // going up 2 if empty && we are on the second rank
    if (y === 1 && board.at(x, y + 1) === '-' && board.at(x, y + 2) === '-')
      moves.push({ kind: 'normal', from: { x, y }, to: { x, y: y + 2 } })
    // captures if there's something to capture
    if (y < 7 && x >= 1 && board.at(x - 1, y + 1) !== '-')
      moves.push({
        kind: 'normal',
        from: { x, y },
        to: { x: x - 1, y: y + 1 },
      })
    if (y < 7 && x < 7 && board.at(x + 1, y + 1) !== '-')
      moves.push({
        kind: 'normal',
        from: { x, y },
        to: { x: x + 1, y: y + 1 },
      })
  }
  if (piece === 'p') {
    // going down 1 if empty
    if (y > 0 && board.at(x, y - 1) === '-')
      moves.push({ kind: 'normal', from: { x, y }, to: { x, y: y - 1 } })
    // going down 2 if empty && we are on the seventh rank
    if (y === 6 && board.at(x, y - 1) === '-' && board.at(x, y - 2) === '-')
      moves.push({ kind: 'normal', from: { x, y }, to: { x, y: y - 2 } })
    // captures if there's something to capture
    if (y > 0 && x < 7 && board.at(x + 1, y - 1) !== '-')
      moves.push({
        kind: 'normal',
        from: { x, y },
        to: { x: x + 1, y: y - 1 },
      })
    if (y > 0 && x >= 1 && board.at(x - 1, y - 1) !== '-')
      moves.push({
        kind: 'normal',
        from: { x, y },
        to: { x: x - 1, y: y - 1 },
      })
  }
  return moves
}

/**
 *
 * @param {Board} board
 * @param {{x: number, y: number}} rook
 * @returns
 */
function rookQuasiLegalMoves(board, rook) {
  let moves = []
  // Walk till we hit a piece or a wall
  for (let x = rook.x - 1, y = rook.y; x >= 0; x--) {
    // left
    moves.push({ kind: 'normal', from: rook, to: { x, y } })
    if (board.at(x, y) !== '-') break
  }
  for (let x = rook.x + 1, y = rook.y; x <= 7; x++) {
    // right
    moves.push({ kind: 'normal', from: rook, to: { x, y } })
    if (board.at(x, y) !== '-') break
  }
  for (let x = rook.x, y = rook.y - 1; y >= 0; y--) {
    // up
    moves.push({ kind: 'normal', from: rook, to: { x, y } })
    if (board.at(x, y) !== '-') break
  }
  for (let x = rook.x, y = rook.y + 1; y <= 7; y++) {
    // down
    moves.push({ kind: 'normal', from: rook, to: { x, y } })
    if (board.at(x, y) !== '-') break
  }
  return moves
}

/**
 *
 * @param {Board} board
 * @param {{x: number, y: number}} bishop
 * @returns
 */
function bishopQuasiLegalMoves(board, bishop) {
  let moves = []
  for (let x = bishop.x - 1, y = bishop.y - 1; x >= 0 && y >= 0; x--, y--) {
    // left up
    moves.push({ kind: 'normal', from: bishop, to: { x, y } })
    if (board.at(x, y) !== '-') break
  }
  for (let x = bishop.x - 1, y = bishop.y + 1; x >= 0 && y <= 7; x--, y++) {
    // left down
    moves.push({ kind: 'normal', from: bishop, to: { x, y } })
    if (board.at(x, y) !== '-') break
  }
  for (let x = bishop.x + 1, y = bishop.y - 1; x <= 7 && y >= 0; x++, y--) {
    // right up
    moves.push({ kind: 'normal', from: bishop, to: { x, y } })
    if (board.at(x, y) !== '-') break
  }
  for (let x = bishop.x + 1, y = bishop.y + 1; x <= 7 && y <= 7; x++, y++) {
    // right down
    moves.push({ kind: 'normal', from: bishop, to: { x, y } })
    if (board.at(x, y) !== '-') break
  }
  return moves
}

/** Generates possible moves for a specific piece based on how pieces move, but without advanced checks.
 *
 * @param {Board} board
 * @param {{x: number, y: number}} coord
 */
function quasiLegalNormalMoves(board, { x, y }) {
  const piece = board.at(x, y)
  let moves = []

  if (piece === '-') return []

  if (piece.toLowerCase() === 'k')
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++)
        moves.push({
          kind: 'normal',
          from: { x, y },
          to: { x: x + i, y: y + j },
        })

  if (piece.toLowerCase() === 'q')
    moves = [
      ...moves,
      ...rookQuasiLegalMoves(board, { x, y }),
      ...bishopQuasiLegalMoves(board, { x, y }),
    ]

  if (piece.toLowerCase() === 'r')
    moves = [...moves, ...rookQuasiLegalMoves(board, { x, y })]

  if (piece.toLowerCase() === 'b')
    moves = [...moves, ...bishopQuasiLegalMoves(board, { x, y })]

  if (piece.toLowerCase() === 'n')
    moves.push(
      { kind: 'normal', from: { x, y }, to: { x: x + 2, y: y + 1 } },
      { kind: 'normal', from: { x, y }, to: { x: x + 2, y: y - 1 } },
      { kind: 'normal', from: { x, y }, to: { x: x + 1, y: y + 2 } },
      { kind: 'normal', from: { x, y }, to: { x: x + 1, y: y - 2 } },
      { kind: 'normal', from: { x, y }, to: { x: x - 2, y: y + 1 } },
      { kind: 'normal', from: { x, y }, to: { x: x - 2, y: y - 1 } },
      { kind: 'normal', from: { x, y }, to: { x: x - 1, y: y + 2 } },
      { kind: 'normal', from: { x, y }, to: { x: x - 1, y: y - 2 } }
    )

  if (piece.toLowerCase() === 'p')
    moves = [...moves, ...pawnQuasiLegalMoves(board, { x, y })]

  return moves
}
