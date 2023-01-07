// @ts-check

/*
TODO: doesn't handle en passant

TODO: perhaps this should be "square" and not "piece"
*/

/** Determine if a piece is attacked by the opponent pieces.
 *
 * @param {Board} board
 * @param {Coord} target
 */
function isAttacked(board, target) {
  // For all pieces on the board, let's see if they can take the target
  for (let pieceX = 0; pieceX < 8; pieceX++) {
    for (let pieceY = 0; pieceY < 8; pieceY++) {
      const xy = new Coord(pieceX, pieceY)
      const piece = board.at(xy)
      if (piece === '-') continue
      if (pieceColor(piece) === pieceColor(board.at(target))) continue

      switch (piece) {
        case 'r':
        case 'R':
          if (isAttackedByRook(board, xy, target)) return true
          break
        case 'b':
        case 'B':
          if (isAttackedByBishop(board, xy, target)) return true
          break
        case 'q':
        case 'Q':
          if (isAttackedByQueen(board, xy, target)) return true
          break
        case 'n':
        case 'N':
          if (isAttackedByKnight(board, xy, target)) return true
          break
        case 'p':
        case 'P':
          if (isAttackedByPawn(board, xy, target)) return true
          break
        case 'k':
        case 'K':
          if (isAttackedByKing(board, xy, target)) return true
          break
      }
    }
  }

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
  if (pieceColor(board.at(pawn)) === 'white') {
    return target.y === pawn.y + 1 && Math.abs(target.x - pawn.x) === 1
  } else {
    return target.y === pawn.y - 1 && Math.abs(target.x - pawn.x) === 1
  }
}
