import { P5CanvasInstance } from '@p5-wrapper/react'

export const DrawConstants = (p5: P5CanvasInstance) => ({
  // Size of a square in pixels.
  CELL: Math.min(60, Math.min(p5.windowWidth, p5.windowHeight) / 8),
  // Size of a piece in pixels.
  PIECE: Math.min(60, Math.min(p5.windowWidth, p5.windowHeight) / 8),
})
