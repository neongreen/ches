import { getMovePiece, getCapture, isCapture, Move, moveIsEqual } from '@/move'
import { legalMoves_slow } from '@/move/legal'
import { isBlack, isKing, isPawn, pieceType } from '@/piece'
import _ from 'lodash'
import { match } from 'ts-pattern'
import { Challenge } from './core'

const _2022_09_26: Challenge = {
  uuid: '3b89e3e6-7551-4d8a-850f-9ac6d380011e',
  title: 'My Favorite Opening',
  link: 'https://www.youtube.com/watch?v=OSCDE_ebc1c',
  challenge:
    'Chess, but your pieces (and pawns) are vampires. They cannot step into the light (squares).',
  isMoveAllowed({ move }): boolean {
    // Can only move to dark squares.
    return match(move)
      .with({ kind: 'normal' }, ({ to }) => to.color() === 'dark')
      .with({ kind: 'enPassant' }, ({ to }) => to.color() === 'dark')
      .with(
        { kind: 'castling' },
        ({ kingTo, rookTo }) => kingTo.color() === 'dark' && rookTo.color() === 'dark'
      )
      .exhaustive()
  },
}

const _2022_05_24: Challenge = {
  uuid: 'f2941f89-4412-448f-94f5-25f7c46dc29b',
  title: 'Slow And Steady',
  link: 'https://www.youtube.com/watch?v=VwH-Gqzfpos',
  challenge: 'Chess, but you can only move pieces (and pawns) one square at a time.',
  isMoveAllowed({ move }): boolean {
    return match(move)
      .with({ kind: 'normal' }, ({ from, to }) => from.kingDistance(to) === 1)
      .with({ kind: 'enPassant' }, ({ from, to }) => from.kingDistance(to) === 1)
      .with({ kind: 'castling' }, () => false)
      .exhaustive()
  },
}

const _2022_06_03: Challenge = {
  uuid: 'd1a66d2b-6382-4037-9231-18f4b94cfdf8',
  title: "I Don't See Anything Wrong",
  link: 'https://www.youtube.com/watch?v=uc4gT029pNA',
  challenge: 'Chess, but your pieces (and pawns) are always right. You cannot move them leftward.',
  isMoveAllowed({ move }): boolean {
    return match(move)
      .with({ kind: 'normal' }, ({ from, to }) => from.x <= to.x)
      .with({ kind: 'enPassant' }, ({ from, to }) => from.x <= to.x)
      .with({ kind: 'castling' }, () => false)
      .exhaustive()
  },
}

const _2022_01_29: Challenge = {
  uuid: '1515dfc7-4ed7-444d-a8cb-ac6b35e699bd',
  title: 'Our Kings Almost Touched',
  link: 'https://www.youtube.com/watch?v=sEdZU-0oHdM',
  challenge: 'Chess, but if your pawn can move, it has to.',
  beaten: {
    name: 'Emily',
    depth: 2,
  },
  isMoveAllowed({ board, move }): boolean {
    // Note: per 3:02 in the video, if you're in check you can move a non-pawn (which is incidentally what this code already does.)
    const pawnMoves = legalMoves_slow(board).filter((move) => isPawn(getMovePiece(board, move)))
    return pawnMoves.length === 0 || pawnMoves.some((pawnMove) => moveIsEqual(pawnMove, move))
  },
}

const _2022_03_07: Challenge = {
  uuid: '7f577d60-083c-47fe-a335-3a4ee406f5c8',
  title: 'Such Torture',
  link: 'https://www.youtube.com/watch?v=IfeUGBXaOUk',
  challenge:
    'Chess, but your king is a commander, you can only move something if your king can see it.',
  beaten: {
    name: 'Emily',
    depth: 2,
  },
  isMoveAllowed({ board, move }): boolean {
    // Only pieces with distance=1 to the king are allowed to move. (1:05 in the video - line of sight doesn't count as "can see"). Unclear if castling is allowed, and theoretically it *can* happen if the opponent takes your N and B - but let's say it's not allowed.
    return (
      match(move)
        // TODO: once again we are assuming that the human is playing white
        .with({ kind: 'normal' }, ({ from }) => board.kings.white.kingDistance(from) <= 1)
        .with({ kind: 'enPassant' }, ({ from }) => board.kings.white.kingDistance(from) <= 1)
        .with({ kind: 'castling' }, () => false)
        .exhaustive()
    )
  },
}

const _2022_03_29: Challenge = {
  uuid: '8f5b6f38-8426-430f-a2ce-698b401a43eb',
  title: "I Don't Invade Anyone Today",
  link: 'https://www.youtube.com/watch?v=XQZFvszSddk',
  challenge: "Chess but your pawns and pieces can't cross the half-way line.",
  beaten: {
    name: 'RauchWolke', // discord
    depth: 2,
  },
  isMoveAllowed({ board, move }): boolean {
    return (
      match(move)
        // TODO: once again we are assuming that the human is playing white
        .with({ kind: 'normal' }, ({ to }) => to.y <= 3)
        .with({ kind: 'enPassant' }, ({ to }) => to.y <= 3)
        .with({ kind: 'castling' }, () => true)
        .exhaustive()
    )
  },
}

const _2022_05_30: Challenge = {
  uuid: '8491849c-db4c-4013-a21b-01b0e9203880',
  title: 'He Offered A Draw...',
  link: 'https://www.youtube.com/watch?v=kfxg5wGLVBw',
  challenge: '100 rated chess but you can only take their most extended piece or pawn.',
  beaten: {
    name: 'Emily',
    depth: 3,
  },
  isMoveAllowed({ board, move }): boolean {
    // If there are several pieces that are equally extended, you can take any of them (1:19). If you're not taking a piece, you can do whatever you want.
    const blackPieces = board.pieces().filter(({ piece }) => isBlack(piece))
    const mostExtendedRow: number = _.min(blackPieces.map(({ coord }) => coord.y))!
    return match(move)
      .with({ kind: 'normal' }, ({ to }) => board.isEmpty(to) || to.y === mostExtendedRow)
      .with({ kind: 'enPassant' }, () => board.enPassantTargetPawn()!.y === mostExtendedRow)
      .with({ kind: 'castling' }, () => true)
      .exhaustive()
  },
}

const _2022_04_21: Challenge = {
  uuid: '5101988d-c2c1-4585-96b7-06aa04d599fd',
  title: 'All Predictions Went Wrong',
  link: 'https://www.youtube.com/watch?v=ZY-TiAVv69I',
  challenge: 'Chess but you have to move your King if you can.',
  isMoveAllowed({ board, move }): boolean {
    const kingMoves = legalMoves_slow(board).filter((move) => isKing(getMovePiece(board, move)))
    return kingMoves.length === 0 || kingMoves.some((kingMove) => moveIsEqual(kingMove, move))
  },
}

const _2022_09_11: Challenge = {
  uuid: '9b88d4dd-e1fe-4120-9792-c2ff15fd5920',
  title: 'I Have To Move The Same Piece As My Opponent Did',
  link: 'https://www.youtube.com/watch?v=jAkBGHEptQQ',
  challenge: 'Chess, but you have to move the same piece (or pawn) as your opponent did last move.',
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
  uuid: 'd7e51e7a-afe6-4880-b5a5-1e5ceb4deec2',
  title: 'Highest Voted Challenge EVER',
  link: 'https://www.youtube.com/watch?v=_bVyt4Who_E',
  challenge: "Chess, but you're horny. You can only take enemy pieces (or pawns) from behind.",
  isMoveAllowed({ board, move }): boolean {
    // Note: no idea about en passant, let's just say it's not allowed.
    const capture = getCapture(board, move)
    return capture === null || capture.victim.y < capture.attacker.y
  },
}

const _2021_12_04: Challenge = {
  uuid: '983bb958-585c-4547-bb91-e88b6f84b9bd',
  title: 'Chess, But Capture Is Forced',
  link: 'https://www.youtube.com/watch?v=gwKbZ_pNZ8M',
  challenge: 'You take when you can.',
  isMoveAllowed({ board, move }): boolean {
    const captures = legalMoves_slow(board).filter((move) => isCapture(board, move))
    return captures.length === 0 || captures.some((x) => moveIsEqual(x, move))
  },
}

const _2023_06_09: Challenge = {
  uuid: 'a96dab9f-3a86-4ec9-a754-c9ca0cabd1e0',
  title: '🏳️‍🌈 Pride Chess',
  link: 'https://www.youtube.com/watch?v=ZSlZrHFGzVU',
  challenge: 'Chess, but its Pride Month. All of your pieces (not pawns) must not move straight.',
  beaten: {
    name: 'Emily',
    depth: 3,
  },
  isMoveAllowed({ board, move }): boolean {
    return match(move)
      .with(
        { kind: 'normal' },
        ({ from, to }) => isPawn(getMovePiece(board, move)) || (from.x !== to.x && from.y !== to.y)
      )
      .with({ kind: 'enPassant' }, () => true)
      .with({ kind: 'castling' }, () => false)
      .exhaustive()
  },
}

/**
 * All Chess Simp challenges.
 */
export const chessSimpChallenges: Challenge[] = _.concat(
  // Dec 2021
  [_2021_12_04],
  // Jan 2022
  [_2022_01_29],
  // Mar 2022
  [_2022_03_07, _2022_03_29],
  // Apr 2022
  [_2022_04_21],
  // May 2022
  [_2022_05_24, _2022_05_30],
  // Jun 2022
  [_2022_06_03],
  // Sep 2022
  [_2022_09_11, _2022_09_26],
  // Feb 2023
  [_2023_02_23],
  // Jun 2023
  [_2023_06_09]
)
