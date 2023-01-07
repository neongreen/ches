/** Coordinates of a square on the chess board. */
class Coord {
  x
  y

  /**
   *
   * @param {number} x 0-7
   * @param {number} y 0-7
   */
  constructor(x, y) {
    this.x = x
    this.y = y
  }

  /** Is the coordinate valid? */
  isValid() {
    return this.x >= 0 && this.x <= 7 && this.y >= 0 && this.y <= 7
  }

  /** Shift by delta.
   *
   * @param {{x: number, y: number}} delta
   * @returns {Coord}
   */
  shift({ x, y }) {
    return new Coord(this.x + x, this.y + y)
  }

  /** Shift north.
   *
   * @returns {Coord}
   */
  n() {
    return new Coord(this.x, this.y + 1)
  }

  /** Shift south.
   *
   * @returns {Coord}
   */
  s() {
    return new Coord(this.x, this.y - 1)
  }

  /** Shift west.
   *
   * @returns {Coord}
   */
  w() {
    return new Coord(this.x - 1, this.y)
  }

  /** Shift east.
   *
   * @returns {Coord}
   */
  e() {
    return new Coord(this.x + 1, this.y)
  }

  /** Shift north-west.
   *
   * @returns {Coord}
   */
  nw() {
    return new Coord(this.x - 1, this.y + 1)
  }

  /** Shift north-east.
   *
   * @returns {Coord}
   */
  ne() {
    return new Coord(this.x + 1, this.y + 1)
  }

  /** Shift south-west.
   *
   * @returns {Coord}
   */
  sw() {
    return new Coord(this.x - 1, this.y - 1)
  }

  /** Shift south-east.
   *
   * @returns {Coord}
   */
  se() {
    return new Coord(this.x + 1, this.y - 1)
  }
}
