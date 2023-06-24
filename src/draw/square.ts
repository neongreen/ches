import { Coord } from '@/utils/coord'
import { DrawConstants } from '@/draw/constants'
import { P5CanvasInstance } from '@p5-wrapper/react'

/**
 * Coordinates of a square on the screen.
 */
export function squareCenter(p5: P5CanvasInstance, coord: Coord) {
  return {
    x: coord.x * DrawConstants(p5).CELL + DrawConstants(p5).CELL / 2,
    y: (7 - coord.y) * DrawConstants(p5).CELL + DrawConstants(p5).CELL / 2,
  }
}
