// @ts-check

const MAX_DEPTH = 2

/** Evaluate a node without recursion, based on heuristics.
 *
 * @param {EvalNode} node
 */
function leafEvalNode(node) {
  const whiteEval = node.material.white + node.development.white / 5
  const blackEval = node.material.black + node.development.black / 5
  return whiteEval - blackEval
}

/** How good would a move be?
 *
 * @param {EvalNode} node
 * @param {number} depth How many moves to look ahead; if 0 then just eval the position
 * @param {Move} move The move to consider
 * @returns {{eval: number, line: Move[]}}
 */
function evalMove(node, depth, move) {
  let newNode = node.clone()
  newNode.executeMove(move)

  if (depth === 0) {
    return {
      eval: leafEvalNode(newNode),
      line: [move],
    }
  } else {
    // Find the best move for the opponent from this position
    const continuation = findBestMove(newNode, depth - 1)
    return {
      eval: continuation.eval,
      line: [move, ...continuation.line],
    }
  }
}

/** What is the best move for the current side?
 *
 * @param {EvalNode} node
 * @param {number} depth
 * @returns {{bestMove: Move | null, eval: number, line: Move[]}}
 */
function findBestMove(node, depth) {
  const moves = generateMoves(node.board)
  if (moves.length === 0) {
    // checkmate
    return {
      bestMove: null,
      eval: node.board.side === WHITE ? -999 : 999,
      line: [],
    }
  }
  const results = moves.map((move) => ({
    bestMove: move,
    ...evalMove(node, depth, move),
  }))
  return results.reduce((best, result) => {
    if (node.board.side === WHITE && result.eval > best.eval) return result
    if (node.board.side === BLACK && result.eval < best.eval) return result
    return best
  }, results[0])
}

/** Find up to N best moves for the current side, ranked.
 *
 * @param {EvalNode} node
 * @param {number} depth
 * @param {number} lines
 * @returns {{move: Move | null, eval: number, line: Move[]}[]}
 */
function findBestMoves(node, depth, lines) {
  const moves = generateMoves(node.board)
  if (moves.length === 0) {
    // checkmate
    return [
      {
        move: null,
        eval: node.board.side === WHITE ? -999 : 999,
        line: [],
      },
    ]
  }
  const results = moves.map((move) => ({
    move,
    ...evalMove(node, depth, move),
  }))
  results.sort((a, b) => {
    if (node.board.side === WHITE) return b.eval - a.eval
    else return a.eval - b.eval
  })
  return results.slice(0, lines)
}
