import { Move, getCapture, getMoveCoord, getMovePiece, isCapture, moveIsEqual } from '@/move'
import { legalMoves_slow } from '@/move/legal'
import { Color, Piece, isBlackPiece, isKing, isPawn, isWhitePiece, pieceType } from '@/piece'
import { Uuid } from '@/utils/uuid'
import _ from 'lodash'
import { match, P } from 'ts-pattern'
import { Challenge, ChallengeMeta } from './core'
import { Coord } from '@/utils/coord'
import { Board } from '@/board'
import { pieceValue } from '@/eval/material'
import { users } from './users'

const _2022_09_26: Challenge = {
  meta: {
    uuid: '3b89e3e6-7551-4d8a-850f-9ac6d380011e',
    title: 'My Favorite Opening',
    link: 'https://www.youtube.com/watch?v=OSCDE_ebc1c',
    challenge:
      'Chess, but your pieces (and pawns) are vampires. They cannot step into the light (squares).',
    beaten: {
      name: users.Mendax.name,
      depth: 1,
    },
  },
  isMoveAllowed({ move }): boolean {
    // Can only move to dark squares.
    return match(move)
      .with({ kind: P.union('normal', 'enPassant') }, ({ to }) => to.color() === 'dark')
      .with(
        { kind: 'castling' },
        ({ kingTo, rookTo }) => kingTo.color() === 'dark' && rookTo.color() === 'dark'
      )
      .exhaustive()
  },
}

const _2022_05_24: Challenge = {
  meta: {
    uuid: 'f2941f89-4412-448f-94f5-25f7c46dc29b',
    title: 'Slow And Steady',
    link: 'https://www.youtube.com/watch?v=VwH-Gqzfpos',
    challenge: 'Chess, but you can only move pieces (and pawns) one square at a time.',
    beaten: {
      name: users.Emily.name,
      depth: 3,
    },
  },
  isMoveAllowed({ move }): boolean {
    return match(move)
      .with({ kind: P.union('normal', 'enPassant') }, ({ from, to }) => from.kingDistance(to) === 1)
      .with({ kind: 'castling' }, () => false)
      .exhaustive()
  },
}

const _2022_06_03: Challenge = {
  meta: {
    uuid: 'd1a66d2b-6382-4037-9231-18f4b94cfdf8',
    title: "I Don't See Anything Wrong",
    link: 'https://www.youtube.com/watch?v=uc4gT029pNA',
    challenge:
      'Chess, but your pieces (and pawns) are always right. You cannot move them leftward.',
    beaten: {
      name: users.Mendax.name,
      depth: 2,
    },
  },
  isMoveAllowed({ move }): boolean {
    return match(move)
      .with({ kind: P.union('normal', 'enPassant') }, ({ from, to }) => from.x <= to.x)
      .with({ kind: 'castling' }, () => false)
      .exhaustive()
  },
}

const _2022_01_29: Challenge = {
  meta: {
    uuid: '1515dfc7-4ed7-444d-a8cb-ac6b35e699bd',
    title: 'Our Kings Almost Touched',
    link: 'https://www.youtube.com/watch?v=sEdZU-0oHdM',
    challenge: 'Chess, but if your pawn can move, it has to.',
    beaten: {
      name: users.Mendax.name,
      depth: 3,
    },
  },
  isMoveAllowed({ board, move }): boolean {
    // Note: per 3:02 in the video, if you're in check you can move a non-pawn (which is incidentally what this code already does.)
    const pawnMoves = legalMoves_slow(board).filter((move) => isPawn(getMovePiece(board, move)))
    return pawnMoves.length === 0 || pawnMoves.some((pawnMove) => moveIsEqual(pawnMove, move))
  },
}

class Challenge_2022_03_07 implements Challenge {
  meta = {
    uuid: '7f577d60-083c-47fe-a335-3a4ee406f5c8',
    title: 'Such Torture',
    link: 'https://www.youtube.com/watch?v=IfeUGBXaOUk',
    challenge:
      'Chess, but your king is a commander, you can only move something if your king can see it.',
    beaten: {
      name: users.Emily.name,
      depth: 2,
    },
  }

  private kingSees = (data: { board: Board; square: Coord }) => {
    // Only pieces with distance=1 to the king are allowed to move. (1:05 in the video - line of sight doesn't count as "can see").
    // TODO: once again we are assuming that the human is playing white
    return data.board.kings.white.kingDistance(data.square) === 1
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move }) => {
    // Note: unclear if castling is allowed, and theoretically it *can* happen if the opponent takes your N and B - but let's say it's not allowed.
    return match(move)
      .with(
        { kind: P.union('normal', 'enPassant') },
        ({ from }) => from.equals(board.kings.white) || this.kingSees({ board, square: from })
      )
      .with({ kind: 'castling' }, () => false)
      .exhaustive()
  }

  highlightSquares: Challenge['highlightSquares'] = ({ board }) => {
    return Board.allSquares()
      .filter((square) => isWhitePiece(board.at(square)) && this.kingSees({ board, square }))
      .map((coord) => ({ color: 'blue', coord }))
  }
}

const _2022_03_29: Challenge = {
  meta: {
    uuid: '8f5b6f38-8426-430f-a2ce-698b401a43eb',
    title: "I Don't Invade Anyone Today",
    link: 'https://www.youtube.com/watch?v=XQZFvszSddk',
    challenge: "Chess but your pawns and pieces can't cross the half-way line.",
    beaten: {
      name: users.Mendax.name,
      depth: 3,
    },
  },
  isMoveAllowed({ board, move }): boolean {
    return (
      match(move)
        // TODO: once again we are assuming that the human is playing white
        .with({ kind: P.union('normal', 'enPassant') }, ({ to }) => to.y <= 3)
        .with({ kind: 'castling' }, () => true)
        .exhaustive()
    )
  },
}

class Challenge_2022_05_30 implements Challenge {
  meta = {
    uuid: '8491849c-db4c-4013-a21b-01b0e9203880',
    title: 'He Offered A Draw...',
    link: 'https://www.youtube.com/watch?v=kfxg5wGLVBw',
    challenge: '100 rated chess but you can only take their most extended piece or pawn.',
    beaten: {
      name: users.Mendax.name,
      depth: 4,
    },
  }

  private mostExtendedRow = (board: Board) => {
    const blackPieces = board.pieces().filter(({ piece }) => isBlackPiece(piece))
    return _.min(blackPieces.map(({ coord }) => coord.y))!
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move }) => {
    // If there are several pieces that are equally extended, you can take any of them (1:19). If you're not taking a piece, you can do whatever you want.
    const mostExtendedRow = this.mostExtendedRow(board)
    return match(move)
      .with({ kind: 'normal' }, ({ to }) => board.isEmpty(to) || to.y === mostExtendedRow)
      .with({ kind: 'enPassant' }, () => board.enPassantTargetPawn()!.y === mostExtendedRow)
      .with({ kind: 'castling' }, () => true)
      .exhaustive()
  }

  highlightSquares: NonNullable<Challenge['highlightSquares']> = ({ board }) => {
    const mostExtendedRow = this.mostExtendedRow(board)
    return Board.allSquares()
      .filter((square) => isBlackPiece(board.at(square)) && square.y === mostExtendedRow)
      .map((coord) => ({ color: 'blue', coord }))
  }
}

const _2022_04_21: Challenge = {
  meta: {
    uuid: '5101988d-c2c1-4585-96b7-06aa04d599fd',
    title: 'All Predictions Went Wrong',
    link: 'https://www.youtube.com/watch?v=ZY-TiAVv69I',
    challenge: 'Chess but you have to move your King if you can.',
    beaten: {
      name: users.Mendax.name,
      depth: 3,
    },
  },
  isMoveAllowed({ board, move }): boolean {
    const kingMoves = legalMoves_slow(board).filter((move) => isKing(getMovePiece(board, move)))
    return kingMoves.length === 0 || kingMoves.some((kingMove) => moveIsEqual(kingMove, move))
  },
}

const _2022_09_11: Challenge = {
  meta: {
    uuid: '9b88d4dd-e1fe-4120-9792-c2ff15fd5920',
    title: 'I Have To Move The Same Piece As My Opponent Did',
    link: 'https://www.youtube.com/watch?v=jAkBGHEptQQ',
    challenge:
      'Chess, but you have to move the same piece (or pawn) as your opponent did last move.',
    beaten: {
      name: users.ManosSef.name,
      depth: 1,
    },
  },
  isMoveAllowed({ history, board, move }): boolean {
    // Note: if playing as white, we allow any move. Unfortunately, the video didn't cover castling. Let's just say castling is a king move.
    const lastMove = _.last(history)
    return (
      lastMove === undefined ||
      pieceType(getMovePiece(lastMove.boardBeforeMove, lastMove.move)) ===
        pieceType(getMovePiece(board, move))
    )
  },
}

const _2023_02_23: Challenge = {
  meta: {
    uuid: 'd7e51e7a-afe6-4880-b5a5-1e5ceb4deec2',
    title: 'Highest Voted Challenge EVER',
    link: 'https://www.youtube.com/watch?v=_bVyt4Who_E',
    challenge: "Chess, but you're horny. You can only take enemy pieces (or pawns) from behind.",
    beaten: {
      name: users.Mendax.name,
      depth: 1,
    },
  },
  isMoveAllowed({ board, move }): boolean {
    // Note: no idea about en passant, let's just say it's not allowed.
    const capture = getCapture(board, move)
    return capture === null || capture.victim.y < capture.attacker.y
  },
}

const _2021_12_04: Challenge = {
  meta: {
    uuid: '983bb958-585c-4547-bb91-e88b6f84b9bd',
    title: 'Chess, But Capture Is Forced',
    link: 'https://www.youtube.com/watch?v=gwKbZ_pNZ8M',
    challenge: 'You take when you can.',
    beaten: {
      name: users.Mendax.name,
      depth: 3,
    },
  },
  isMoveAllowed({ board, move }): boolean {
    const captures = legalMoves_slow(board).filter((move) => isCapture(board, move))
    return captures.length === 0 || captures.some((x) => moveIsEqual(x, move))
  },
}

const _2023_06_09: Challenge = {
  meta: {
    uuid: 'a96dab9f-3a86-4ec9-a754-c9ca0cabd1e0',
    title: '🏳️‍🌈 Pride Chess',
    link: 'https://www.youtube.com/watch?v=ZSlZrHFGzVU',
    challenge: 'Chess, but its Pride Month. All of your pieces (not pawns) must not move straight.',
    beaten: {
      name: users.Mendax.name,
      depth: 4,
    },
  },
  isMoveAllowed({ board, move }): boolean {
    return match(move)
      .with(
        { kind: P.union('normal', 'enPassant') },
        ({ from, to }) => isPawn(getMovePiece(board, move)) || (from.x !== to.x && from.y !== to.y)
      )
      .with({ kind: 'castling' }, () => false)
      .exhaustive()
  },
}

class Challenge_2021_08_17 implements Challenge {
  meta = {
    uuid: 'ad9def81-d090-468d-91fb-58570ec87f39',
    title: 'Play On The Same File',
    link: 'https://www.youtube.com/watch?v=yyI9jKf85TY',
    challenge:
      "When your opponent's piece (or pawn) lands on a column, you must play a piece (or pawn) that is on the same column.",
  }

  private isColumnAllowed(data: { column: number; history: { move: Move }[] }) {
    // When the opponent does castling, we'll actually the player to use either the rook column or the king column.
    const lastMove = _.last(data.history)
    if (!lastMove) return true
    return match(lastMove.move)
      .with(
        { kind: P.union('normal', 'enPassant') },
        ({ to: lastMoveTo }) => data.column === lastMoveTo.x
      )
      .with(
        { kind: 'castling' },
        ({ kingTo: lastMoveKingTo, rookTo: lastMoveRookTo }) =>
          data.column === lastMoveKingTo.x || data.column === lastMoveRookTo.x
      )
      .exhaustive()
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ history, move }) => {
    return this.isColumnAllowed({ column: getMoveCoord(move).from.x, history })
  }

  highlightSquares: NonNullable<Challenge['highlightSquares']> = ({ history, board }) => {
    if (history.length === 0) return [] // No highlight on first move
    if (board.side === Color.Black) return []
    return Board.allSquares()
      .filter(
        (square) =>
          isWhitePiece(board.at(square)) && this.isColumnAllowed({ column: square.x, history })
      )
      .map((square) => ({ coord: square, color: 'blue' }))
  }
}

class Challenge_2023_04_01 implements Challenge {
  meta = {
    uuid: '3f7fe35d-6811-4ed5-a498-e820aedd2587',
    title: 'Easiest Win of This Channel',
    link: 'https://www.youtube.com/watch?v=NSyf4uVbn7c',
    challenge:
      'Chess but you can only capture pieces which worth more or equal points than the piece you captured before it.',
    beaten: {
      name: users.Mendax.name,
      depth: 3,
    },
  }

  private minCaptureValue = 0

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move }) => {
    const capture = getCapture(board, move)
    if (!capture) return true
    return pieceValue(board.at(capture.victim)) >= this.minCaptureValue
  }

  recordMove: NonNullable<Challenge['recordMove']> = ({ boardBeforeMove, move }) => {
    const capture = getCapture(boardBeforeMove, move)
    if (boardBeforeMove.side === Color.White && capture) {
      this.minCaptureValue = pieceValue(boardBeforeMove.at(capture.victim))
    }
  }
}

class Challenge_2022_09_19 implements Challenge {
  meta = {
    uuid: '52620ef2-a11c-4b1c-bb40-652a482ba724',
    title: 'The Entire Game Were BLUNDERS !!!',
    link: 'https://www.youtube.com/watch?v=TRkyi_i6EqY',
    challenge:
      'Chess, but your pawns are plotting against you, you need to get rid of them before making any captures.',
    beaten: {
      name: users.Mendax.name,
      depth: 1,
    },
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move }) => {
    const capture = getCapture(board, move)
    const noPawnsLeft = board.pieces().every(({ piece }) => piece !== Piece.WhitePawn)
    return capture ? noPawnsLeft : true
  }
}

class Challenge_2022_02_10 implements Challenge {
  meta = {
    uuid: '934f5a6b-c5af-48b5-ac4f-bc4ba3cc3c31',
    title: 'I Moved Pawns 100 Times',
    link: 'https://www.youtube.com/watch?v=lco2G0Ri-DM',
    challenge: 'If your opponent moves a piece, you move a pawn, and vice versa.',
    beaten: {
      name: users.Mendax.name,
      depth: 1,
    },
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ history, board, move }) => {
    const lastMove = _.last(history)
    if (!lastMove) return true
    const lastMoveIsPawn = isPawn(getMovePiece(lastMove.boardBeforeMove, lastMove.move))
    const currentMoveIsPawn = isPawn(getMovePiece(board, move))
    return lastMoveIsPawn !== currentMoveIsPawn
  }
}

class Challenge_2022_05_31 implements Challenge {
  meta = {
    uuid: '39efe131-5fb0-4294-b832-1d4d31a89f84',
    title: 'What If He Only Moves His King ??',
    link: 'https://www.youtube.com/watch?v=KDPXaL9V7hY',
    challenge: 'Chess, but the only piece you can take is the piece your opponent had just moved.',
    beaten: {
      name: users.RotomAppliance.name,
      depth: 3,
    },
  }

  private allowedVictims = (history: { move: Move; boardBeforeMove: Board }[]) => {
    const lastMove = _.last(history)
    if (!lastMove) return null
    // Note: kings can't ever be captured so we take care not to return them
    return match(lastMove.move)
      .with({ kind: P.union('normal', 'enPassant') }, ({ from, to }) =>
        isKing(lastMove.boardBeforeMove.at(from)) ? [] : [to]
      )
      .with({ kind: 'castling' }, ({ rookTo }) => [rookTo])
      .exhaustive()
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ history, board, move }) => {
    const allowedVictims = this.allowedVictims(history)
    if (!allowedVictims) return true
    const capture = getCapture(board, move)
    if (!capture) return true
    return allowedVictims.some((victim) => victim.equals(capture.victim))
  }

  highlightSquares: NonNullable<Challenge['highlightSquares']> = ({ history, board }) => {
    const allowedVictims = this.allowedVictims(history)
    if (!allowedVictims || board.side === Color.Black) return []
    return allowedVictims.map((victim) => ({ coord: victim, color: 'blue' }))
  }
}

/**
 * All Chess Simp challenges.
 */
export const chessSimpChallenges: Map<Uuid, { meta: ChallengeMeta; create: () => Challenge }> =
  new Map(
    _.concat(
      // Aug 2021
      [() => new Challenge_2021_08_17() as Challenge],
      // Dec 2021
      [() => _2021_12_04],
      // Jan 2022
      [() => _2022_01_29],
      // Feb 2022
      [() => new Challenge_2022_02_10() as Challenge],
      // Mar 2022
      [() => new Challenge_2022_03_07() as Challenge, () => _2022_03_29],
      // Apr 2022
      [() => _2022_04_21],
      // May 2022
      [
        () => _2022_05_24,
        () => new Challenge_2022_05_30() as Challenge,
        () => new Challenge_2022_05_31() as Challenge,
      ],
      // Jun 2022
      [() => _2022_06_03],
      // Sep 2022
      [() => _2022_09_11, () => new Challenge_2022_09_19(), () => _2022_09_26],
      // Feb 2023
      [() => _2023_02_23],
      // Apr 2023
      [() => new Challenge_2023_04_01() as Challenge],
      // Jun 2023
      [() => _2023_06_09]
    ).map((challengeFn) => [
      challengeFn().meta.uuid,
      { meta: challengeFn().meta, create: challengeFn },
    ])
  )
