const MAX_DEPTH = 3

function leafEvalPos(pos) {
  return pos.material.white - pos.material.black
}

// Returns {move, eval}
function evalPos(pos) {
  const go = (depthBudget, pos) => {
    if (depthBudget === 0) return { move: null, eval: leafEvalPos(pos) }
    else {
      const moves = generateMoves(pos)
      if (moves.length === 0) {
        // checkmate
        if (pos.side === 'white') return { move: null, eval: -999 }
        else return { move: null, eval: 999 }
      }
      const results = moves.map((move) => {
        const newPos = executeMove(pos, move)
        return {
          move,
          pos: newPos,
          eval: go(depthBudget - 1, newPos).eval,
        }
      })
      return results.reduce((best, result) => {
        if (pos.side === 'white' && result.eval > best.eval) return result
        if (pos.side === 'black' && result.eval < best.eval) return result
        return best
      }, results[0])
    }
  }
  const result = go(MAX_DEPTH, pos)
  return result
}
