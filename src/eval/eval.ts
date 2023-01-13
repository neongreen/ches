import { Board } from '@/board'
import { generateMoves, isInCheck, Move } from '@/move'
import { allPieceTypes, Color, Piece, pieceType, PieceType } from '@/piece'
import { match } from 'ts-pattern'
import { pieceTypePoints } from './material'
import { EvalNode } from './node'

export const MAX_DEPTH = 2

// https://rustic-chess.org/search/ordering/mvv_lva.html
const MVV_LVA: number[][] = []
for (const victim of allPieceTypes) {
  MVV_LVA[victim] = []
  for (const attacker of allPieceTypes) {
    MVV_LVA[victim][attacker] = pieceTypePoints(victim) * 1000 + 1000 - pieceTypePoints(attacker)
  }
}

/**
 * Move ordering. We want to search most promising moves first because then the search tree might get smaller due to alpha-beta pruning.
 */
function scoreMove(board: Board, move: Move): number {
  return match(move)
    .with({ kind: 'normal' }, (move) => {
      // NB: We could just do "material difference" but this would give equal trades score 0, and we don't want that — we still want to look at captures before quiet moves.
      const from = board.at(move.from)
      const to = board.at(move.to)
      if (to === Piece.Empty) return 0
      return MVV_LVA[pieceType(to)][pieceType(from)]
    })
    .with({ kind: 'castling' }, () => 0)
    .exhaustive()
}

/** Generate moves ordered by `scoreMove`. */
function generateOrderedMoves(board: Board): Move[] {
  return generateMoves(board)
    .map((move) => ({ move, score: scoreMove(board, move) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.move)
}

/**
 * Detect when the game is over.
 */
function isGameOver(board: Board, possibleMoves: Move[]): 'whiteWon' | 'blackWon' | 'draw' | null {
  if (board.isThreefoldRepetition()) return 'draw'
  if (possibleMoves.length === 0) {
    if (isInCheck(board)) {
      // Checkmate
      return board.side === Color.White ? 'blackWon' : 'whiteWon'
    } else {
      // Stalemate
      return 'draw'
    }
  }
  return null
}

/**
 * Evaluate a node without recursion, based on heuristics.
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
function evalMove(
  node: EvalNode,
  depth: number,
  move: Move,
  alpha = -Infinity,
  beta = Infinity
): { eval: number; line: Move[] } {
  let newNode = node.clone()
  newNode.executeMove(move)

  // For leaf nodes, we don't try to detect checkmate, because it's expensive and requires generating all possible moves. So we're fine with just ignoring checkmate/stalemate/threefold repetition here. `findBestMove` does check for this kind of thing, though, because it has to generate possible moves no matter what.

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

/**
 * What is the best move for the current side?
 */
export function findBestMove(
  node: EvalNode,
  depth: number,
  alpha = -Infinity,
  beta = Infinity
): { bestMove: Move | null; eval: number; line: Move[] } {
  const possibleMoves = generateOrderedMoves(node.board)

  switch (isGameOver(node.board, possibleMoves)) {
    case 'whiteWon':
      return { bestMove: null, eval: 999, line: [] }
    case 'blackWon':
      return { bestMove: null, eval: -999, line: [] }
    case 'draw':
      return { bestMove: null, eval: 0, line: [] }
    case null:
      break
  }

  // https://en.wikipedia.org/wiki/Alpha–beta_pruning#Pseudocode
  let bestEval = {
    bestMove: null as Move | null,
    eval: node.board.side === Color.White ? -Infinity : Infinity,
    line: [] as Move[],
  }
  for (const move of possibleMoves) {
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

/**
 * Find up to N best moves for the current side, ranked.
 */
export function findBestMoves(
  node: EvalNode,
  depth: number,
  lines: number
): { move: Move | null; eval: number; line: Move[] }[] {
  const possibleMoves = generateOrderedMoves(node.board)

  switch (isGameOver(node.board, possibleMoves)) {
    case 'whiteWon':
      return [{ move: null, eval: 999, line: [] }]
    case 'blackWon':
      return [{ move: null, eval: -999, line: [] }]
    case 'draw':
      return [{ move: null, eval: 0, line: [] }]
    case null:
      break
  }

  const results = possibleMoves.map((move) => ({
    move,
    ...evalMove(node, depth, move),
  }))
  results.sort((a, b) => {
    if (node.board.side === Color.White) return b.eval - a.eval
    else return a.eval - b.eval
  })
  return results.slice(0, lines)
}

export function renderEval(eval_: number) {
  const evalEval = Math.round(eval_ * 100) / 100
  const evalSign = evalEval > 0 ? '+' : ''
  return `${evalSign}${evalEval.toFixed(2)}`
}
