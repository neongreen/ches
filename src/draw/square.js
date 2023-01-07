/** Coordinates of a square on the screen.
 *
 * @param {Coord} coord
 */
function squareCenter({ x, y }) {
  return { x: x * CELL + CELL / 2, y: (7 - y) * CELL + CELL / 2 }
}
