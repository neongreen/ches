import { Board } from '@/board'
import { isInCheck, Move, moveIsEqual } from '@/move'
import { isLegalMove } from '@/move/legal'
import { quasiLegalMoves } from '@/move/quasiLegal'
import { allPieceTypes, Color, MaybePiece, MaybePieceType, PieceEmpty, pieceType } from '@/piece'
import { Zobrist } from '@/zobrist'
import _ from 'lodash'
import { leafEvalNode } from './eval'
import { pieceTypeValue } from './material'
import { EvalNode } from './node'
import { isMate, mateByBlack, mateByWhite, Score } from './score'

type TranspositionTableEntry = {
  /** Board `state()` */
  state: string
  score: Score
  depth: number
  goodMove: Move | null
  line: Move[]
}

/**
 * MVV_LVA is indexed by [PieceType][PieceType]. It lists the score of a capture move, where the first index is the victim and the second index is the attacker. Higher score is better.
 *
 * https://rustic-chess.org/search/ordering/mvv_lva.html
 *
 * > MVV-LVA stands for Most Valuable Victim, Least Valuable Attacker. This is a move ordering technique that does exactly what it describes: it orders the capture moves, ordered from the strongest to the weakest. The more valuable the captured piece is, and the less valuable the attacker is, the stronger the capture will be, and thus it will be ordered higher in the move list. As a consequence, the alpha-beta function will search the stronger captures first, which causes it to find better moves faster, and thus it can disregard large portions of the search tree.
 */
const MVV_LVA: number[][] = []
for (const victim of allPieceTypes) {
  MVV_LVA[victim] = []
  for (const attacker of allPieceTypes) {
    // The number 1000 doesn't matter, we just want to prioritize the victim choice over the attacker choice (i.e. QxQ should have priority over PxP)
    MVV_LVA[victim][attacker] = pieceTypeValue(victim) * 1000 + 1000 - pieceTypeValue(attacker)
  }
}

/** Generate moves ordered by `scoreMove`. */
function quasiLegalOrderedMoves(board: Board, goodMove?: Move): Move[] {
  return quasiLegalMoves(board)
    .map((move) => ({ move, order: moveOrder(board, move, goodMove) }))
    .sort((a, b) => b.order - a.order)
    .map((x) => x.move)
}

/**
 * Move ordering. We want to search most promising moves first because then the search tree might get smaller due to alpha-beta pruning.
 *
 * This function returns a number that is higher for better moves.
 *
 * @param goodMove If we already know a good move, we want to prioritize it in the search.
 */
function moveOrder(board: Board, move: Move, goodMove?: Move): number {
  if (goodMove && moveIsEqual(move, goodMove)) return 1_000_000
  switch (move.kind) {
    case 'normal': {
      // NB: We could just do "material difference" but this would give equal trades score 0, and we don't want that — we still want to look at captures before quiet moves.
      const from = board.at(move.from)
      const to = board.at(move.to)
      if (to === PieceEmpty) return 0
      return MVV_LVA[pieceType(to)][pieceType(from)]
    }
    case 'castling': {
      // ...Maybe castling is also usually good? I don't know.
      return 500_000
    }
    case 'enPassant': {
      // We always want to prioritize en passant in move search, because en passant is cool. This will only influence bestMove if there is a choice between en passant and a normal capture. (...And maybe not even then.)
      return 500_000
    }
  }
}

/**
 * Searching the game tree.
 *
 * This algorithm uses *alpha-beta pruning* to avoid evaluating moves that are already worse than the best move found so far. For example, if we already found a move X that gives us an eval of 10 (`alpha`), and now we are evaluating a move Y and the opponent has a response that results in eval 9, we can stop evaluating Y.
 */
export class Search {
  /**
   * A transposition table, storing previously seen positions.
   *
   * We limit ourselves to 2^16 entries so that we wouldn't have to worry about memory usage.
   */
  private transpositionTable: (TranspositionTableEntry | undefined)[] = new Array(2 ** 16).fill(
    undefined
  )

  /**
   * Does the transposition table contain an entry for the given board?
   */
  private probeTransposition(hash: Zobrist, state: string): TranspositionTableEntry | undefined {
    const entry = this.transpositionTable[hash & 0xffff]
    if (entry && entry.state === state) return entry
  }

  /**
   * Write an entry to the transposition table.
   */
  private writeTransposition(hash: Zobrist, entry: TranspositionTableEntry) {
    this.transpositionTable[hash & 0xffff] = entry
  }

  /**
   * Utility function: evaluate a board using search.
   *
   * Shouldn't be used during the game. (You already have access to the score - `findBestMove` returns it.)
   *
   * @param depth *[>= 0]* If 0 then just eval the board immediately.
   */
  evaluateBoard(board: Board, depth: number): Score {
    if (depth === 0) return this.evaluateDepth0(new EvalNode(board)).score
    else return this.findBestMove(new EvalNode(board), depth).score
  }

  /**
   * Utility function: evaluate a move using search. The move to evaluate counts as part of the depth.
   *
   * Shouldn't be used during the game. (You already have access to the score - `findBestMove` returns it.)
   *
   * @param depth *[>= 1]* If 1 then just eval the board immediately after the move
   */
  evaluateMove(board: Board, move: Move, depth: number): Score {
    const boardAfterMove = board.clone()
    boardAfterMove.executeMove(move)
    return this.evaluateBoard(boardAfterMove, depth - 1)
  }

  /**
   * What is the best move for the current side?
   *
   * @param depth [>= 1] How many moves to look ahead. At depth=1, just eval all the moves.
   * @param alpha The minimum eval white can force (white wants to maximize)
   * @param beta The maximum eval black can force (black wants to minimize)
   */
  findBestMove(
    node: EvalNode,
    depth: number,
    alpha = -Infinity,
    beta = Infinity
  ): { move: Move | null; score: Score; line: Move[] } {
    // Threefold repetition is a draw
    if (node.board.isThreefoldRepetition()) return { move: null, score: 0, line: [] }

    const hash = node.board.hash
    const state = node.board.state()

    // Check if we have seen this position before
    const transpositionTableEntry = this.probeTransposition(hash, state)
    if (transpositionTableEntry && transpositionTableEntry.depth >= depth) {
      return {
        move: transpositionTableEntry.goodMove,
        score: transpositionTableEntry.score,
        line: transpositionTableEntry.line,
      }
    }

    // If we have seen the position before, but the depth is not deep enough, we can still use the good move from the transposition table to order the moves. Specifically, we'll try that move first.
    const goodMove = transpositionTableEntry?.goodMove

    const quasiLegalMoves = quasiLegalOrderedMoves(node.board, goodMove || undefined)

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
          : this.findBestMove(newNode, depth - 1, alpha, beta)

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
      best.score = isInCheck(node.board, node.board.side)
        ? node.board.side === Color.White
          ? mateByBlack(0)
          : mateByWhite(0)
        : 0
    }
    // If we did find a move, it could be a fifty-move draw
    // (NB: not 100% sure about edge cases here; does checkmate take priority over 50-move draw?)
    else if (node.board.halfmoveClock >= 100) {
      best = { move: null, score: 0, line: [] }
    }
    // If we did find a move and it's not a draw:
    else {
      best.line = [best.move, ...best.line]
      if (isMate(best.score)) {
        if (best.score > 0) best.score--
        else best.score++
      }
    }

    // Update the transposition table (only if depth>1 because we want to save memory)
    if (depth > 1)
      this.writeTransposition(hash, {
        state,
        depth,
        goodMove: best.move,
        score: best.score,
        line: best.line,
      })

    return best
  }

  /**
   * Immediately evaluate a node. Like `findBestMove` but with depth=0. Unlike `leafEvalNode`, this function takes draws and mate into account.
   *
   * We don't provide a move, but only an indication of whether a move exists or not. A draw is indicated by `{ move: null, score: 0 }`.
   */
  evaluateDepth0(node: EvalNode): { move: 'exists' | null; score: Score } {
    // Threefold repetition is a draw
    if (node.board.isThreefoldRepetition()) return { move: null, score: 0 }

    // Check if we have seen this position before
    const transpositionTableEntry = this.probeTransposition(node.board.hash, node.board.state())
    if (transpositionTableEntry)
      return {
        move: transpositionTableEntry.goodMove && 'exists',
        score: transpositionTableEntry.score,
      }

    // Check if we can make any moves
    const legalMoveExists = quasiLegalOrderedMoves(node.board).some((move) => {
      let boardAfterMove = node.board.clone()
      boardAfterMove.executeMove(move)
      return isLegalMove(node.board, boardAfterMove, move, { assumeQuasiLegal: true })
    })

    // If we didn't find any moves, it's either checkmate or stalemate.
    if (!legalMoveExists) {
      return {
        move: null,
        score: isInCheck(node.board, node.board.side)
          ? node.board.side === Color.White
            ? mateByBlack(0)
            : mateByWhite(0)
          : 0,
      }
    }
    // If we did find a move, it could be a fifty-move draw
    // (NB: not 100% sure about edge cases here; does checkmate take priority over 50-move draw?)
    else if (node.board.halfmoveClock >= 100) {
      return { move: null, score: 0 }
    }
    // If we did find a move and it's not a draw:
    else {
      return { move: 'exists', score: leafEvalNode(node) }
    }
  }
}
