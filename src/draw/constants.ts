import { P5CanvasInstance } from '@p5-wrapper/react'

/**
 * Maximum width of the chessboard.
 */
export const MAX_CHESSBOARD_WIDTH = 456

export const DrawConstants = (p5: P5CanvasInstance) => ({
  // Size of a square in pixels.
  CELL: Math.min(MAX_CHESSBOARD_WIDTH, Math.min(p5.windowWidth, p5.windowHeight)) / 8,
  // Size of a piece in pixels.
  PIECE: Math.min(MAX_CHESSBOARD_WIDTH, Math.min(p5.windowWidth, p5.windowHeight)) / 8,
})
