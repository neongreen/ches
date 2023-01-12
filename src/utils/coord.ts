/** Coordinates of a square on the chess board. */
export class Coord {
  x: number
  y: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  /** Is the coordinate valid? */
  isValid() {
    return this.x >= 0 && this.x <= 7 && this.y >= 0 && this.y <= 7
  }

  /** Shift by delta.
   */
  shift(delta: { x: number; y: number }) {
    return new Coord(this.x + delta.x, this.y + delta.y)
  }

  /** Shift north.
   */
  n() {
    return new Coord(this.x, this.y + 1)
  }

  /** Shift south.
   */
  s() {
    return new Coord(this.x, this.y - 1)
  }

  /** Shift west.
   */
  w() {
    return new Coord(this.x - 1, this.y)
  }

  /** Shift east.
   */
  e() {
    return new Coord(this.x + 1, this.y)
  }

  /** Shift north-west.
   */
  nw() {
    return new Coord(this.x - 1, this.y + 1)
  }

  /** Shift north-east.
   */
  ne() {
    return new Coord(this.x + 1, this.y + 1)
  }

  /** Shift south-west.
   */
  sw() {
    return new Coord(this.x - 1, this.y - 1)
  }

  /** Shift south-east.
   */
  se() {
    return new Coord(this.x + 1, this.y - 1)
  }
}

/** All squares between two points (but not counting those points), when shifting by delta.
 *
 * Useful for sliding pieces (rook, bishop, queen).
 */
export function squaresBetween(
  from: Coord,
  to: Coord,
  delta: { x: number; y: number }
): Coord[] {
  let squares = []
  let xy = from.shift(delta)
  while (!(xy.x === to.x && xy.y === to.y)) {
    squares.push(xy)
    xy = xy.shift(delta)
  }
  return squares
}
