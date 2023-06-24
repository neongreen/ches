import { Piece } from '@/piece'
import { Coord } from '@/utils/coord'
import { squareCenter } from '@/draw/square'
import { DrawConstants } from '@/draw/constants'
import { P5CanvasInstance } from '@p5-wrapper/react'
import type { Image } from 'p5'

let pieceImages: Image[] = []

export function preloadPieceImages(p5: P5CanvasInstance) {
  pieceImages[Piece.BlackKing] = p5.loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Chess_kdt45.svg/240px-Chess_kdt45.svg.png'
  )
  pieceImages[Piece.BlackQueen] = p5.loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Chess_qdt45.svg/240px-Chess_qdt45.svg.png'
  )
  pieceImages[Piece.BlackRook] = p5.loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Chess_rdt45.svg/240px-Chess_rdt45.svg.png'
  )
  pieceImages[Piece.BlackBishop] = p5.loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Chess_bdt45.svg/240px-Chess_bdt45.svg.png'
  )
  pieceImages[Piece.BlackKnight] = p5.loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Chess_ndt45.svg/240px-Chess_ndt45.svg.png'
  )
  pieceImages[Piece.BlackPawn] = p5.loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Chess_pdt45.svg/240px-Chess_pdt45.svg.png'
  )
  pieceImages[Piece.WhiteKing] = p5.loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Chess_klt45.svg/240px-Chess_klt45.svg.png'
  )
  pieceImages[Piece.WhiteQueen] = p5.loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Chess_qlt45.svg/240px-Chess_qlt45.svg.png'
  )
  pieceImages[Piece.WhiteRook] = p5.loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Chess_rlt45.svg/240px-Chess_rlt45.svg.png'
  )
  pieceImages[Piece.WhiteBishop] = p5.loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Chess_blt45.svg/240px-Chess_blt45.svg.png'
  )
  pieceImages[Piece.WhiteKnight] = p5.loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Chess_nlt45.svg/240px-Chess_nlt45.svg.png'
  )
  pieceImages[Piece.WhitePawn] = p5.loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Chess_plt45.svg/240px-Chess_plt45.svg.png'
  )
}

/** Draw one piece.
 */
export function drawPiece(p5: P5CanvasInstance, coord: Coord, piece: Piece) {
  p5.push()
  p5.imageMode(p5.CENTER)
  const { x: squareX, y: squareY } = squareCenter(p5, coord)
  if (pieceImages[piece])
    p5.image(pieceImages[piece], squareX, squareY, DrawConstants(p5).PIECE, DrawConstants(p5).PIECE)
  p5.pop()
}

/** Draw a dragged piece.
 */
export function drawDraggedPiece(p5: P5CanvasInstance, piece: Piece) {
  p5.push()
  p5.imageMode(p5.CENTER)
  p5.image(
    pieceImages[piece],
    p5.mouseX,
    p5.mouseY,
    DrawConstants(p5).PIECE * 1.3,
    DrawConstants(p5).PIECE * 1.3
  )
  p5.pop()
}
