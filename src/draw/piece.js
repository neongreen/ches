let pieceImages = []

function preloadPieceImages() {
  pieceImages[BLACK_KING] = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Chess_kdt45.svg/240px-Chess_kdt45.svg.png'
  )
  pieceImages[BLACK_QUEEN] = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Chess_qdt45.svg/240px-Chess_qdt45.svg.png'
  )
  pieceImages[BLACK_ROOK] = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Chess_rdt45.svg/240px-Chess_rdt45.svg.png'
  )
  pieceImages[BLACK_BISHOP] = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Chess_bdt45.svg/240px-Chess_bdt45.svg.png'
  )
  pieceImages[BLACK_KNIGHT] = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Chess_ndt45.svg/240px-Chess_ndt45.svg.png'
  )
  pieceImages[BLACK_PAWN] = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Chess_pdt45.svg/240px-Chess_pdt45.svg.png'
  )
  pieceImages[WHITE_KING] = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Chess_klt45.svg/240px-Chess_klt45.svg.png'
  )
  pieceImages[WHITE_QUEEN] = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Chess_qlt45.svg/240px-Chess_qlt45.svg.png'
  )
  pieceImages[WHITE_ROOK] = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Chess_rlt45.svg/240px-Chess_rlt45.svg.png'
  )
  pieceImages[WHITE_BISHOP] = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Chess_blt45.svg/240px-Chess_blt45.svg.png'
  )
  pieceImages[WHITE_KNIGHT] = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Chess_nlt45.svg/240px-Chess_nlt45.svg.png'
  )
  pieceImages[WHITE_PAWN] = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Chess_plt45.svg/240px-Chess_plt45.svg.png'
  )
}

/** Draw one piece.
 *
 * @param {Coord} coord
 * @param {Piece} piece
 */
function drawPiece(coord, piece) {
  push()
  imageMode(CENTER)
  const { x: squareX, y: squareY } = squareCenter(coord)
  if (pieceImages[piece])
    image(pieceImages[piece], squareX, squareY, PIECE, PIECE)
  pop()
}

/** Draw a dragged piece.
 *
 * @param {Piece} piece
 */
function drawDraggedPiece(piece) {
  push()
  imageMode(CENTER)
  image(pieceImages[piece], mouseX, mouseY, PIECE * 1.3, PIECE * 1.3)
  pop()
}
