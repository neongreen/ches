const PIECE_POINTS = {
  K: 4,
  Q: 9,
  R: 5,
  B: 3,
  N: 3,
  P: 1,
  k: 4,
  q: 9,
  r: 5,
  b: 3,
  n: 3,
  p: 1,
}

function piecePoints(piece) {
  return PIECE_POINTS[piece]
}
