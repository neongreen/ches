// @ts-check

/** Coordinates of a square on the screen.
 *
 * @param {Coord} coord
 */
function squareCenter(coord) {
  return { x: coord.x * CELL + CELL / 2, y: (7 - coord.y) * CELL + CELL / 2 }
}
