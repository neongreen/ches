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

function pawnQuasiLegalMoves(pos, { x, y }) {
  const piece = pos.board[y][x]
  let moves = []
  if (piece === 'P') {
    // going up 1 if empty
    if (y >= 1 && pos.board[y - 1][x] === '-')
      moves.push({ kind: 'normal', from: { x, y }, to: { x, y: y - 1 } })
    // going up 2 if empty && we are on the second rank
    if (y === 6 && pos.board[y - 1][x] === '-' && pos.board[y - 2][x] === '-')
      moves.push({ kind: 'normal', from: { x, y }, to: { x, y: y - 2 } })
    // captures if there's something to capture
    if (y >= 1 && x >= 1 && pos.board[y - 1][x - 1] !== '-')
      moves.push({
        kind: 'normal',
        from: { x, y },
        to: { x: x - 1, y: y - 1 },
      })
    if (y >= 1 && x <= 6 && pos.board[y - 1][x + 1] !== '-')
      moves.push({
        kind: 'normal',
        from: { x, y },
        to: { x: x + 1, y: y - 1 },
      })
  }
  if (piece === 'p') {
    // going down 1 if empty
    if (y <= 6 && pos.board[y + 1][x] === '-')
      moves.push({ kind: 'normal', from: { x, y }, to: { x, y: y + 1 } })
    // going down 2 if empty && we are on the seventh rank
    if (y === 1 && pos.board[y + 1][x] === '-' && pos.board[y + 2][x] === '-')
      moves.push({ kind: 'normal', from: { x, y }, to: { x, y: y + 2 } })
    // captures if there's something to capture
    if (y <= 6 && x <= 6 && pos.board[y + 1][x + 1] !== '-')
      moves.push({
        kind: 'normal',
        from: { x, y },
        to: { x: x + 1, y: y + 1 },
      })
    if (y <= 6 && x >= 1 && pos.board[y + 1][x - 1] !== '-')
      moves.push({
        kind: 'normal',
        from: { x, y },
        to: { x: x - 1, y: y + 1 },
      })
  }
  return moves
}

function rookQuasiLegalMoves(pos, c) {
  let moves = []
  // Walk till we hit a piece or a wall
  for (let x = c.x - 1, y = c.y; x >= 0; x--) {
    // left
    moves.push({ kind: 'normal', from: c, to: { x, y } })
    if (pos.board[y][x] !== '-') break
  }
  for (let x = c.x + 1, y = c.y; x <= 7; x++) {
    // right
    moves.push({ kind: 'normal', from: c, to: { x, y } })
    if (pos.board[y][x] !== '-') break
  }
  for (let x = c.x, y = c.y - 1; y >= 0; y--) {
    // up
    moves.push({ kind: 'normal', from: c, to: { x, y } })
    if (pos.board[y][x] !== '-') break
  }
  for (let x = c.x, y = c.y + 1; y <= 7; y++) {
    // down
    moves.push({ kind: 'normal', from: c, to: { x, y } })
    if (pos.board[y][x] !== '-') break
  }
  return moves
}

function bishopQuasiLegalMoves(pos, c) {
  let moves = []
  for (let x = c.x - 1, y = c.y - 1; x >= 0 && y >= 0; x--, y--) {
    // left up
    moves.push({ kind: 'normal', from: c, to: { x, y } })
    if (pos.board[y][x] !== '-') break
  }
  for (let x = c.x - 1, y = c.y + 1; x >= 0 && y <= 7; x--, y++) {
    // left down
    moves.push({ kind: 'normal', from: c, to: { x, y } })
    if (pos.board[y][x] !== '-') break
  }
  for (let x = c.x + 1, y = c.y - 1; x <= 7 && y >= 0; x++, y--) {
    // right up
    moves.push({ kind: 'normal', from: c, to: { x, y } })
    if (pos.board[y][x] !== '-') break
  }
  for (let x = c.x + 1, y = c.y + 1; x <= 7 && y <= 7; x++, y++) {
    // right down
    moves.push({ kind: 'normal', from: c, to: { x, y } })
    if (pos.board[y][x] !== '-') break
  }
  return moves
}

// Generate possible moves for a specific piece based on how pieces move but without advanced checks
function quasiLegalNormalMoves(pos, { x, y }) {
  const piece = pos.board[y][x]
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
      ...rookQuasiLegalMoves(pos, { x, y }),
      ...bishopQuasiLegalMoves(pos, { x, y }),
    ]

  if (piece.toLowerCase() === 'r') moves = [...moves, ...rookQuasiLegalMoves(pos, { x, y })]

  if (piece.toLowerCase() === 'b') moves = [...moves, ...bishopQuasiLegalMoves(pos, { x, y })]

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

  if (piece.toLowerCase() === 'p') moves = [...moves, ...pawnQuasiLegalMoves(pos, { x, y })]

  return moves
}
