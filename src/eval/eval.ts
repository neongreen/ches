import { EvalNode } from './node'
import { Score } from './score'

/**
 * Evaluate a node without recursion, based on heuristics.
 */
export function leafEvalNode(node: EvalNode): Score {
  // NB: we don't want floating-point numbers anywhere
  const whiteEval =
    node.material.white * 100 + node.development.white * 20 + node.pawnAdvancement.white
  const blackEval =
    node.material.black * 100 + node.development.black * 20 + node.pawnAdvancement.black
  return whiteEval - blackEval
}
