import { Board } from '@/board'
import { isInCheck, Move } from '@/move'
import { isLegalMove } from '@/move/legal'
import { quasiLegalMoves } from '@/move/quasiLegal'
import { allPieceTypes, Color, Piece, pieceType, PieceType } from '@/piece'
import { match } from 'ts-pattern'
import { pieceTypePoints } from './material'
import { EvalNode } from './node'
import { isMate, mateByBlack, mateByWhite, Score } from './score'

// https://rustic-chess.org/search/ordering/mvv_lva.html
const MVV_LVA: number[][] = []
for (const victim of allPieceTypes) {
  MVV_LVA[victim] = []
  for (const attacker of allPieceTypes) {
    // The number 1000 doesn't matter, we just want to prioritize the victim choice over the attacker choice (i.e. QxQ should have priority over PxP)
    MVV_LVA[victim][attacker] = pieceTypePoints(victim) * 1000 + 1000 - pieceTypePoints(attacker)
  }
}

/**
 * Move ordering. We want to search most promising moves first because then the search tree might get smaller due to alpha-beta pruning.
 */
function moveOrder(board: Board, move: Move): number {
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
function quasiLegalOrderedMoves(board: Board): Move[] {
  return quasiLegalMoves(board)
    .map((move) => ({ move, order: moveOrder(board, move) }))
    .sort((a, b) => b.order - a.order)
    .map((x) => x.move)
}

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

/**
 * What is the best move for the current side?
 *
 * This function uses *alpha-beta pruning* to avoid evaluating moves that are already worse than the best move found so far. For example, if we already found a move X that gives us an eval of 10 (`alpha`), and now we are evaluating a move Y and the opponent has a response that results in eval 9, we can stop evaluating Y.
 *
 * @param depth How many moves to look ahead; if 1 then just eval all the moves
 * @param alpha The minimum eval white can force (white wants to maximize)
 * @param beta The maximum eval black can force (black wants to minimize)
 */
export function findBestMove(
  node: EvalNode,
  depth: number,
  alpha = -Infinity,
  beta = Infinity
): { move: Move | null; score: Score; line: Move[] } {
  if (node.board.isThreefoldRepetition()) return { move: null, score: 0, line: [] }

  const quasiLegalMoves = quasiLegalOrderedMoves(node.board)

  // https://en.wikipedia.org/wiki/Alpha–beta_pruning#Pseudocode
  let best = {
    move: null as Move | null,
    score: node.board.side === Color.White ? -Infinity : Infinity,
    line: [] as Move[],
  }

  for (const move of quasiLegalMoves) {
    // First, execute the move and check it for legality.
    //
    // We don't want to evaluate `isLegalMove` for the whole list at once, because alpha/beta-cutoff might let us abort the search early. So we only generate quasi-legal moves, and then check if the move is legal before evaluating it.
    let boardAfterMove = node.board.clone()
    boardAfterMove.executeMove(move)
    if (!isLegalMove(node.board, boardAfterMove, move, { assumeQuasiLegal: true })) continue

    // Evaluate the move
    const newNode = node.clone()
    newNode.executeMove(move, boardAfterMove)
    const current =
      depth === 1
        ? { score: leafEvalNode(newNode), line: [] }
        : findBestMove(newNode, depth - 1, alpha, beta)

    if (node.board.side === Color.White) {
      if (current.score > best.score) best = { ...current, move }
      // If black can force a worse eval (in previously considered variations) than the eval we just found, we can stop evaluating this branch. This is because black won't actually *let us* go into this branch — by definition of 'beta', they can force a worse one.
      if (best.score > beta) break
      // Also, if we found a better eval than 'alpha', we can update the alpha.
      if (best.score > alpha) alpha = best.score
    } else {
      // Correspondingly, black wants to minimize, and that's what 'beta' is for. Now 'best' refers to the *smallest* eval we can find.
      if (current.score < best.score) best = { ...current, move }
      if (best.score < alpha) break
      if (best.score < beta) beta = best.score
    }
  }

  // If we didn't find any moves, it's either checkmate or stalemate.
  if (best.move === null) {
    return {
      move: null,
      score: isInCheck(node.board, node.board.side)
        ? node.board.side === Color.White
          ? mateByBlack(0)
          : mateByWhite(0)
        : 0,
      line: [],
    }
  }

  best.line = [best.move!, ...best.line]
  if (isMate(best.score)) {
    if (best.score > 0) best.score--
    else best.score++
  }
  return best
}
