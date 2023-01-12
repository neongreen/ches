import { Coord } from '@/utils/coord'
import { DrawConstants } from '@/draw/constants'

/**
 * Coordinates of a square on the screen.
 */
export function squareCenter(coord: Coord) {
  return {
    x: coord.x * DrawConstants.CELL + DrawConstants.CELL / 2,
    y: (7 - coord.y) * DrawConstants.CELL + DrawConstants.CELL / 2,
  }
}
