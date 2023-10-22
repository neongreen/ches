import { Coord } from '@/utils/coord'

describe('isSameDiagonal', () => {
  describe('bottom-left to top-right diagonals', () => {
    for (const [a, b] of [
      ['a1', 'b2'],
      ['a1', 'c3'],
      ['a1', 'd4'],
      ['b2', 'h8'],
      ['a2', 'g8'],
      ['a3', 'f8'],
      ['b1', 'h7'],
      ['c1', 'h6'],
    ]) {
      test(`${a} and ${b}`, () => {
        expect(Coord.fromAlgebraic(a).isSameDiagonal(Coord.fromAlgebraic(b))).toBe(true)
        expect(Coord.fromAlgebraic(b).isSameDiagonal(Coord.fromAlgebraic(a))).toBe(true)
      })
    }
  })
  describe('top-left to bottom-right diagonals', () => {
    for (const [a, b] of [
      ['h1', 'g2'],
      ['h1', 'f3'],
      ['h1', 'e4'],
      ['g2', 'a8'],
      ['h2', 'b8'],
      ['h3', 'c8'],
      ['g1', 'a7'],
      ['f1', 'a6'],
    ]) {
      test(`${a} and ${b}`, () => {
        expect(Coord.fromAlgebraic(a).isSameDiagonal(Coord.fromAlgebraic(b))).toBe(true)
        expect(Coord.fromAlgebraic(b).isSameDiagonal(Coord.fromAlgebraic(a))).toBe(true)
      })
    }
  })
  describe('non-diagonals', () => {
    for (const [a, b] of [
      ['a1', 'a2'],
      ['a1', 'b1'],
      ['d7', 'd8'],
      ['d7', 'a7'],
      ['b2', 'c4'],
    ]) {
      test(`${a} and ${b}`, () => {
        expect(Coord.fromAlgebraic(a).isSameDiagonal(Coord.fromAlgebraic(b))).toBe(false)
        expect(Coord.fromAlgebraic(b).isSameDiagonal(Coord.fromAlgebraic(a))).toBe(false)
      })
    }
  })
})
