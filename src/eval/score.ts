/**
 * Eval score.
 *
 * Positive is good for white, negative is good for black.
 */
export type Score = number

export function mateByWhite(ply: number): Score {
  // Mate in 1 = 31999, mate in 2 = 31998, etc. Mate in X should be better the lower X is.
  return 32000 - ply
}

export function mateByBlack(ply: number): Score {
  return -32000 + ply
}

export function isMate(score: Score): boolean {
  return Math.abs(score) >= 31000
}

export function renderScore(score: Score): string {
  if (isMate(score)) {
    const ply = 32000 - Math.abs(score)
    const moves = Math.ceil(ply / 2)
    return score > 0 ? `#${moves}` : `#-${moves}`
  } else {
    const trunc = score / 100
    const sign = trunc > 0 ? '+' : ''
    return `${sign}${trunc.toFixed(2)}`
  }
}
