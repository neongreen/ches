// @ts-check

const PIECE_POINTS = {
  K: 4,
  Q: 9,
  R: 5,
  B: 3,
  N: 3,
  P: 1,
}

function piecePoints(piece) {
  if (piece === '-') return 0
  if (piece >= 'a' && piece <= 'z') return PIECE_POINTS[piece.toUpperCase()]
  return PIECE_POINTS[piece]
}
