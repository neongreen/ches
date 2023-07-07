import { Coord } from '@/utils/coord'
import { DrawConstants } from '@/draw/constants'
import { P5CanvasInstance } from '@p5-wrapper/react'

/**
 * Coordinates of a square on the screen.
 */
export function squareXY(
  p5: P5CanvasInstance<any>,
  coord: Coord
): {
  center: { x: number; y: number }
  topLeft: { x: number; y: number }
  bottomRight: { x: number; y: number }
} {
  return {
    center: {
      x: coord.x * DrawConstants(p5).CELL + DrawConstants(p5).CELL / 2,
      y: (7 - coord.y) * DrawConstants(p5).CELL + DrawConstants(p5).CELL / 2,
    },
    topLeft: {
      x: coord.x * DrawConstants(p5).CELL,
      y: (7 - coord.y) * DrawConstants(p5).CELL,
    },
    bottomRight: {
      x: coord.x * DrawConstants(p5).CELL + DrawConstants(p5).CELL,
      y: (7 - coord.y) * DrawConstants(p5).CELL + DrawConstants(p5).CELL,
    },
  }
}
