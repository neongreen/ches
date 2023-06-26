/**
 * Coordinates of a square on the chess board.
 *
 * a1 is `Coord(0, 0)` and h8 is `Coord(7, 7)`.
 */
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

  equals(other: Coord) {
    return this.x === other.x && this.y === other.y
  }

  /** Convert from algebraic notation. Upper and lower case letters are supported. */
  static fromAlgebraic(algebraic: string) {
    const x = algebraic.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0)
    const y = algebraic.charCodeAt(1) - '1'.charCodeAt(0)
    return new Coord(x, y)
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

  /**
   * All squares between two points.
   *
   * @param to The end point.
   * @param mode Whether to include the start and end points.
   */
  pathTo(to: Coord, mode: 'inclusive' | 'exclusive'): Coord[] {
    const delta = { x: Math.sign(to.x - this.x), y: Math.sign(to.y - this.y) }
    let squares = []
    let xy = this.shift(delta)
    if (mode === 'inclusive') squares.push(this)
    while (!(xy.x === to.x && xy.y === to.y)) {
      squares.push(xy)
      xy = xy.shift(delta)
    }
    if (mode === 'inclusive') squares.push(to)
    return squares
  }

  color(): 'light' | 'dark' {
    return (this.x + this.y) % 2 === 0 ? 'dark' : 'light'
  }

  /**
   * https://en.wikipedia.org/wiki/Chebyshev_distance
   *
   * How many moves would a king need to make to get to the other square?
   */
  kingDistance(to: Coord) {
    return Math.max(Math.abs(this.x - to.x), Math.abs(this.y - to.y))
  }

  /**
   * Distance horizontally, vertically, or diagonally.
   *
   * Returns `null` if can't reach via a straight line.
   */
  queenDistance(to: Coord): number | null {
    if (this.x === to.x) return Math.abs(this.y - to.y)
    if (this.y === to.y) return Math.abs(this.x - to.x)
    if (Math.abs(this.x - to.x) === Math.abs(this.y - to.y)) return Math.abs(this.x - to.x)
    return null
  }
}
