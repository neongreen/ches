/** Determine if a piece is attacked by the opponent pieces

TODO: doesn't handle en passant

TODO: perhaps this should be "square" and not "piece"

TODO: I'm half-sure I'm wrong about which way the pawns go
*/

function isAttacked(pos, target) {
  // For all pieces on the board, let's see if they can take the target
  for (let pieceX = 0; pieceX < 8; pieceX++) {
    for (let pieceY = 0; pieceY < 8; pieceY++) {
      const piece = pos.board[pieceY][pieceX]
      if (piece === '-') continue
      if (pieceColor(piece) === pieceColor(pos.board[target.y][target.x])) continue

      const xy = { x: pieceX, y: pieceY }
      switch (piece) {
        case 'r':
        case 'R':
          if (isAttackedByRook(pos, xy, target)) return true
        case 'b':
        case 'B':
          if (isAttackedByBishop(pos, xy, target)) return true
        case 'q':
        case 'Q':
          if (isAttackedByQueen(pos, xy, target)) return true
        case 'n':
        case 'N':
          if (isAttackedByKnight(pos, xy, target)) return true
        case 'p':
        case 'P':
          if (isAttackedByPawn(pos, xy, target)) return true
        case 'k':
        case 'K':
          if (isAttackedByKing(pos, xy, target)) return true
      }
    }
  }

  return false
}

function isAttackedByRook(pos, rook, target) {
  if (rook.x === target.x) {
    for (let y = min(rook.y, target.y) + 1; y < max(rook.y, target.y); y++) {
      if (pos.board[y][target.x] !== '-') return false
    }
    return true
  } else if (rook.y === target.y) {
    for (let x = min(rook.x, target.x) + 1; x < max(rook.x, target.x); x++) {
      if (pos.board[target.y][x] !== '-') return false
    }
    return true
  } else {
    return false
  }
}

function isAttackedByBishop(pos, bishop, target) {
  if (bishop.x + bishop.y === target.x + target.y) {
    const delta = bishop.x < target.x ? 1 : -1
    let x = bishop.x + delta
    let y = bishop.y - delta
    while (x !== target.x) {
      if (pos.board[y][x] !== '-') return false
      x += delta
      y -= delta
    }
    return true
  } else if (bishop.x - bishop.y === target.x - target.y) {
    const delta = bishop.x < target.x ? 1 : -1
    let x = bishop.x + delta
    let y = bishop.y + delta
    while (x !== target.x) {
      if (pos.board[y][x] !== '-') return false
      x += delta
      y += delta
    }
    return true
  } else {
    return false
  }
}

function isAttackedByQueen(pos, queen, target) {
  return isAttackedByRook(pos, queen, target) || isAttackedByBishop(pos, queen, target)
}

function isAttackedByKnight(pos, knight, target) {
  const xd = Math.abs(knight.x - target.x)
  const yd = Math.abs(knight.y - target.y)
  return (xd === 1 && yd === 2) || (xd === 2 && yd === 1)
}

function isAttackedByKing(pos, king, target) {
  const xd = Math.abs(king.x - target.x)
  const yd = Math.abs(king.y - target.y)
  return xd <= 1 && yd <= 1
}

function isAttackedByPawn(pos, pawn, target) {
  if (pieceColor(pos.board[pawn.y][pawn.x]) === 'white') {
    return target.y === pawn.y + 1 && Math.abs(target.x - pawn.x) === 1
  } else {
    return target.y === pawn.y - 1 && Math.abs(target.x - pawn.x) === 1
  }
}
