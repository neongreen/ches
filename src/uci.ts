import readline from 'node:readline'
import { Board } from '@/board'
import { Search } from '@/eval/search'
import { EvalNode } from '@/eval/node'
import { Coord } from '@/utils/coord'
import { Move } from '@/move'
import { Color, Piece, makePiece, PieceType, pieceType } from '@/piece'

/** Convert an engine Move into UCI string */
export function moveToUci(move: Move): string {
  switch (move.kind) {
    case 'normal': {
      const promo = move.promotion ?
        pieceType(move.promotion) === PieceType.Knight ? 'n' :
        pieceType(move.promotion) === PieceType.Bishop ? 'b' :
        pieceType(move.promotion) === PieceType.Rook ? 'r' :
        pieceType(move.promotion) === PieceType.Queen ? 'q' : ''
        : ''
      return move.from.toAlgebraic() + move.to.toAlgebraic() + promo
    }
    case 'castling':
      return move.kingFrom.toAlgebraic() + move.kingTo.toAlgebraic()
    case 'enPassant':
      return move.from.toAlgebraic() + move.to.toAlgebraic()
  }
}

/** Parse a UCI string into a Move */
export function parseUciMove(board: Board, str: string): Move {
  const from = Coord.fromAlgebraic(str.slice(0,2))
  const to = Coord.fromAlgebraic(str.slice(2,4))
  const promoLetter = str[4]
  const piece = board.at(from)

  if (pieceType(piece) === PieceType.King && Math.abs(from.x - to.x) === 2) {
    const isWhite = board.side === Color.White
    const rookFrom = new Coord(to.x === 6 ? 7 : 0, isWhite ? 0 : 7)
    const rookTo = new Coord(to.x === 6 ? 5 : 3, isWhite ? 0 : 7)
    return { kind: 'castling', kingFrom: from, kingTo: to, rookFrom, rookTo }
  }

  if (
    pieceType(piece) === PieceType.Pawn &&
    board.enPassantTargetSquare &&
    to.equals(board.enPassantTargetSquare)
  ) {
    return {
      kind: 'enPassant',
      from,
      to,
      capture: board.at(board.enPassantTargetPawn()!) as Piece,
      captureCoord: board.enPassantTargetPawn()!,
    }
  }

  let promotion: Piece | null = null
  if (promoLetter) {
    switch (promoLetter) {
      case 'q':
        promotion = makePiece(board.side, PieceType.Queen)
        break
      case 'r':
        promotion = makePiece(board.side, PieceType.Rook)
        break
      case 'b':
        promotion = makePiece(board.side, PieceType.Bishop)
        break
      case 'n':
        promotion = makePiece(board.side, PieceType.Knight)
        break
    }
  }

  return {
    kind: 'normal',
    from,
    to,
    promotion,
    capture: board.at(to),
  }
}

/** Start a UCI loop on stdin/stdout */
export function startUci() {
  let board = new Board()
  const search = new Search()
  const rl = readline.createInterface({ input: process.stdin })

  rl.on('line', (line) => {
    const tokens = line.trim().split(/\s+/)
    const cmd = tokens[0]
    switch (cmd) {
      case 'uci':
        console.log('id name Ches')
        console.log('id author Unknown')
        console.log('uciok')
        break
      case 'isready':
        console.log('readyok')
        break
      case 'ucinewgame':
        board = new Board()
        break
      case 'position':
        if (tokens[1] === 'startpos') {
          board = new Board()
          const movesIndex = tokens.indexOf('moves')
          if (movesIndex !== -1) {
            const moves = tokens.slice(movesIndex + 1)
            for (const m of moves) {
              const mv = parseUciMove(board, m)
              board.executeMove(mv)
            }
          }
        } else if (tokens[1] === 'fen') {
          const movesIndex = tokens.indexOf('moves')
          const fen = tokens.slice(2, movesIndex === -1 ? undefined : movesIndex).join(' ')
          board = new Board()
          board.setFen(fen)
          if (movesIndex !== -1) {
            const moves = tokens.slice(movesIndex + 1)
            for (const m of moves) {
              const mv = parseUciMove(board, m)
              board.executeMove(mv)
            }
          }
        }
        break
      case 'go': {
        let depth = 1
        const i = tokens.indexOf('depth')
        if (i !== -1) depth = parseInt(tokens[i + 1])
        const result = search.findBestMove(new EvalNode(board), depth)
        const best = result.move ? moveToUci(result.move) : '(none)'
        console.log('bestmove ' + best)
        break
      }
      case 'quit':
        rl.close()
        process.exit(0)
    }
  })
}

