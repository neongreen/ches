// @ts-check

const MAX_DEPTH = 3

/** Evaluate a node without recursion, based on heuristics.
 *
 * @param {EvalNode} node
 */
function leafEvalNode(node) {
  return node.material.white - node.material.black
}

/** Evaluate a position up to a certain depth.
 *
 * @param {EvalNode} node
 * @returns {{bestMove: Move | null, eval: number}}
 */
function evalNode(node) {
  const go = (
    /** @type {number} */ depthBudget,
    /** @type {EvalNode} */ node
  ) => {
    if (depthBudget === 0) return { bestMove: null, eval: leafEvalNode(node) }
    else {
      const moves = generateMoves(node.board)
      if (moves.length === 0) {
        // checkmate
        if (node.board.side === 'white') return { bestMove: null, eval: -999 }
        else return { bestMove: null, eval: 999 }
      }
      const results = moves.map((move) => {
        let newNode = node.clone()
        newNode.executeMove(move)
        return {
          bestMove: move,
          node: newNode,
          eval: go(depthBudget - 1, newNode).eval,
        }
      })
      return results.reduce((best, result) => {
        if (node.board.side === 'white' && result.eval > best.eval)
          return result
        if (node.board.side === 'black' && result.eval < best.eval)
          return result
        return best
      }, results[0])
    }
  }
  const result = go(MAX_DEPTH, node)
  return result
}
