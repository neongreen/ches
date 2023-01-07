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
 * @param {Coord} pawn
 * @returns {Move[]}
 */
function pawnQuasiLegalMoves(board, pawn) {
  const piece = board.at(pawn)
  /** @type {Move[]} */
  let moves = []
  if (piece === 'P') {
    // going up 1 if empty
    if (board.isEmpty(pawn.n()))
      moves.push({ kind: 'normal', from: pawn, to: pawn.n() })
    // going up 2 if empty && we are on the second rank
    if (pawn.y === 1 && board.isEmpty(pawn.n()) && board.isEmpty(pawn.n().n()))
      moves.push({ kind: 'normal', from: pawn, to: pawn.n().n() })
    // captures if there's something to capture
    if (board.isOccupied(pawn.ne()))
      moves.push({ kind: 'normal', from: pawn, to: pawn.ne() })
    if (board.isOccupied(pawn.nw()))
      moves.push({ kind: 'normal', from: pawn, to: pawn.nw() })
  }
  if (piece === 'p') {
    // going down 1 if empty
    if (board.isEmpty(pawn.s()))
      moves.push({ kind: 'normal', from: pawn, to: pawn.s() })
    // going down 2 if empty && we are on the seventh rank
    if (pawn.y === 6 && board.isEmpty(pawn.s()) && board.isEmpty(pawn.s().s()))
      moves.push({ kind: 'normal', from: pawn, to: pawn.s().s() })
    // captures if there's something to capture
    if (board.isOccupied(pawn.se()))
      moves.push({ kind: 'normal', from: pawn, to: pawn.se() })
    if (board.isOccupied(pawn.sw()))
      moves.push({ kind: 'normal', from: pawn, to: pawn.sw() })
  }
  return moves
}

/**
 *
 * @param {Board} board
 * @param {Coord} rook
 * @returns {Move[]}
 */
function rookQuasiLegalMoves(board, rook) {
  /** @type {Move[]} */
  let moves = []
  const deltas = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ]
  for (let delta of deltas) {
    let xy = rook.shift(delta)
    while (board.isEmpty(xy)) {
      moves.push({ kind: 'normal', from: rook, to: xy })
      xy = xy.shift(delta)
    }
  }
  return moves
}

/**
 *
 * @param {Board} board
 * @param {Coord} rook
 * @returns {Move[]}
 */
function bishopQuasiLegalMoves(board, rook) {
  /** @type {Move[]} */
  let moves = []
  const deltas = [
    { x: 1, y: 1 },
    { x: -1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: -1 },
  ]
  for (let delta of deltas) {
    let xy = rook.shift(delta)
    while (board.isEmpty(xy)) {
      moves.push({ kind: 'normal', from: rook, to: xy })
      xy = xy.shift(delta)
    }
  }
  return moves
}

/** Generates possible moves for a specific piece based on how pieces move, but without advanced checks.
 *
 * @param {Board} board
 * @param {Coord} coord
 * @returns {Move[]}
 */
function quasiLegalNormalMoves(board, coord) {
  const piece = board.at(coord)
  /** @type {Move[]} */
  let moves = []

  if (piece === '-') return []

  if (piece.toLowerCase() === 'k')
    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        moves.push({ kind: 'normal', from: coord, to: coord.shift({ x, y }) })

  if (piece.toLowerCase() === 'q') {
    moves.push(...rookQuasiLegalMoves(board, coord))
    moves.push(...bishopQuasiLegalMoves(board, coord))
  }

  if (piece.toLowerCase() === 'r')
    moves.push(...rookQuasiLegalMoves(board, coord))

  if (piece.toLowerCase() === 'b')
    moves.push(...bishopQuasiLegalMoves(board, coord))

  if (piece.toLowerCase() === 'n') {
    const deltas = [
      { x: 2, y: 1 },
      { x: 2, y: -1 },
      { x: 1, y: 2 },
      { x: 1, y: -2 },
      { x: -2, y: 1 },
      { x: -2, y: -1 },
      { x: -1, y: 2 },
      { x: -1, y: -2 },
    ]
    for (const delta of deltas)
      moves.push({ kind: 'normal', from: coord, to: coord.shift(delta) })
  }

  if (piece.toLowerCase() === 'p')
    moves.push(...pawnQuasiLegalMoves(board, coord))

  return moves
}
