// @ts-check

// TODO: en passant
// TODO: maybe "square" and not "piece"?

/** Determine if a piece is attacked by the opponent pieces.
 *
 * @param {Board} board
 * @param {Coord} target
 */
function isAttacked(board, target) {
  // For all pieces on the board, let's see if they can take the target
  const targetPiece = board.at(target)
  const isAttackedBy = (coord) => {
    const piece = board.at(coord)
    if (piece === EMPTY) return false
    if (color(piece) === color(targetPiece)) return false
    if (isRook(piece)) return isAttackedByRook(board, coord, target)
    if (isBishop(piece)) return isAttackedByBishop(board, coord, target)
    if (isQueen(piece)) return isAttackedByQueen(board, coord, target)
    if (isKnight(piece)) return isAttackedByKnight(board, coord, target)
    if (isPawn(piece)) return isAttackedByPawn(board, coord, target)
    if (isKing(piece)) return isAttackedByKing(board, coord, target)
  }
  for (let pieceX = 0; pieceX < 8; pieceX++)
    for (let pieceY = 0; pieceY < 8; pieceY++)
      if (isAttackedBy(new Coord(pieceX, pieceY))) return true
  return false
}

/**
 * @param {Board} board
 * @param {Coord} rook
 * @param {Coord} target
 */
function isAttackedByRook(board, rook, target) {
  if (rook.x === target.x) {
    const [min, max] = [Math.min(rook.y, target.y), Math.max(rook.y, target.y)]
    for (let y = min + 1; y < max; y++) {
      if (board.isOccupied(new Coord(target.x, y))) return false
    }
    return true
  } else if (rook.y === target.y) {
    const [min, max] = [Math.min(rook.x, target.x), Math.max(rook.x, target.x)]
    for (let x = min + 1; x < max; x++) {
      if (board.isOccupied(new Coord(x, target.y))) return false
    }
    return true
  } else {
    return false
  }
}

/**
 * @param {Board} board
 * @param {Coord} bishop
 * @param {Coord} target
 */
function isAttackedByBishop(board, bishop, target) {
  if (bishop.x + bishop.y === target.x + target.y) {
    const delta = bishop.x < target.x ? 1 : -1
    let x = bishop.x + delta
    let y = bishop.y - delta
    while (x !== target.x) {
      if (board.isOccupied(new Coord(x, y))) return false
      x += delta
      y -= delta
    }
    return true
  } else if (bishop.x - bishop.y === target.x - target.y) {
    const delta = bishop.x < target.x ? 1 : -1
    let x = bishop.x + delta
    let y = bishop.y + delta
    while (x !== target.x) {
      if (board.isOccupied(new Coord(x, y))) return false
      x += delta
      y += delta
    }
    return true
  } else {
    return false
  }
}

/**
 * @param {Board} board
 * @param {Coord} queen
 * @param {Coord} target
 */
function isAttackedByQueen(board, queen, target) {
  return (
    isAttackedByRook(board, queen, target) ||
    isAttackedByBishop(board, queen, target)
  )
}

/**
 * @param {Board} board
 * @param {Coord} knight
 * @param {Coord} target
 */
function isAttackedByKnight(board, knight, target) {
  const xd = Math.abs(knight.x - target.x)
  const yd = Math.abs(knight.y - target.y)
  return (xd === 1 && yd === 2) || (xd === 2 && yd === 1)
}

/**
 * @param {Board} board
 * @param {Coord} king
 * @param {Coord} target
 */
function isAttackedByKing(board, king, target) {
  const xd = Math.abs(king.x - target.x)
  const yd = Math.abs(king.y - target.y)
  return xd <= 1 && yd <= 1
}

/**
 * @param {Board} board
 * @param {Coord} pawn
 * @param {Coord} target
 */
function isAttackedByPawn(board, pawn, target) {
  if (color(board.at(pawn)) === WHITE) {
    return target.y === pawn.y + 1 && Math.abs(target.x - pawn.x) === 1
  } else {
    return target.y === pawn.y - 1 && Math.abs(target.x - pawn.x) === 1
  }
}
