import { generateMoves, Move } from '@/move'
import { Color } from '@/piece'
import { EvalNode } from './node'

export const MAX_DEPTH = 2

/** Evaluate a node without recursion, based on heuristics.
 */
export function leafEvalNode(node: EvalNode) {
  const whiteEval = node.material.white + node.development.white / 5
  const blackEval = node.material.black + node.development.black / 5
  return whiteEval - blackEval
}

/**
 * How good would a move be?
 *
 * This function uses *alpha-beta pruning* to avoid evaluating moves that are already worse than the best move found so far. For example, if we already found a move X that gives us an eval of 10 (`alpha`), and now we are evaluating a move Y and the opponent has a response that results in eval 9, we can stop evaluating Y.
 *
 * @param depth How many moves to look ahead; if 0 then just eval the position
 * @param move The move to consider
 * @param alpha The minimum eval white can force (white wants to maximize)
 * @param beta The maximum eval black can force (black wants to minimize)
 */
export function evalMove(
  node: EvalNode,
  depth: number,
  move: Move,
  alpha = -Infinity,
  beta = Infinity
): { eval: number; line: Move[] } {
  let newNode = node.clone()
  newNode.executeMove(move)

  if (depth === 0) {
    return {
      eval: leafEvalNode(newNode),
      line: [move],
    }
  }

  // Find the best move for the opponent from this position
  const continuation = findBestMove(newNode, depth - 1, alpha, beta)
  return {
    eval: continuation.eval,
    line: [move, ...continuation.line],
  }
}

/** What is the best move for the current side?
 */
export function findBestMove(
  node: EvalNode,
  depth: number,
  alpha = -Infinity,
  beta = Infinity
): { bestMove: Move | null; eval: number; line: Move[] } {
  const moves = generateMoves(node.board)
  if (moves.length === 0) {
    // checkmate
    // TODO: could also be stalemate
    // TODO: use a better eval than 999
    return {
      bestMove: null,
      eval: node.board.side === Color.White ? -999 : 999,
      line: [],
    }
  }

  // https://en.wikipedia.org/wiki/Alpha–beta_pruning#Pseudocode
  let bestEval = {
    bestMove: null as Move | null,
    eval: node.board.side === Color.White ? -Infinity : Infinity,
    line: [] as Move[],
  }
  for (const move of moves) {
    const currEval = {
      bestMove: move,
      ...evalMove(node, depth, move, alpha, beta),
    }
    if (node.board.side === Color.White) {
      if (currEval.eval > bestEval.eval) bestEval = currEval
      // If black can force a worse eval (in previously considered variations) than the eval we just found, we can stop evaluating this branch altogether. This is because black won't actually *let us* go into this branch — by definition of 'beta', they can force a worse one.
      if (bestEval.eval > beta) break
      // Also, if we found a better eval than 'alpha', we can update the alpha.
      if (bestEval.eval > alpha) alpha = bestEval.eval
    } else {
      // Correspondingly, black wants to minimize, and that's what 'beta' is for. Now 'bestEval' refers to the *smallest* eval we can find.
      if (currEval.eval < bestEval.eval) bestEval = currEval
      if (bestEval.eval < alpha) break
      if (bestEval.eval < beta) beta = bestEval.eval
    }
  }

  return bestEval
}

/** Find up to N best moves for the current side, ranked.
 */
export function findBestMoves(
  node: EvalNode,
  depth: number,
  lines: number
): { move: Move | null; eval: number; line: Move[] }[] {
  const moves = generateMoves(node.board)
  if (moves.length === 0) {
    // checkmate
    return [
      {
        move: null,
        eval: node.board.side === Color.White ? -999 : 999,
        line: [],
      },
    ]
  }
  const results = moves.map((move) => ({
    move,
    ...evalMove(node, depth, move),
  }))
  results.sort((a, b) => {
    if (node.board.side === Color.White) return b.eval - a.eval
    else return a.eval - b.eval
  })
  return results.slice(0, lines)
}