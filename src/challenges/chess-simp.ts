import { getMovePiece, getCapture, isCapture, Move, moveIsEqual } from '@/move'
import { legalMoves_slow } from '@/move/legal'
import { isBlack, isKing, isPawn, pieceType } from '@/piece'
import _ from 'lodash'
import { match } from 'ts-pattern'
import { Challenge } from './core'

const _2022_09_26: Challenge = {
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
  title: 'Slow And Steady',
  link: 'https://www.youtube.com/watch?v=VwH-Gqzfpos',
  challenge: 'Chess, but you can only move pieces (and pawns) one square at a time.',
  isMoveAllowed({ move }): boolean {
    return match(move)
      .with({ kind: 'normal' }, ({ from, to }) => from.chessboardDistance(to) === 1)
      .with({ kind: 'enPassant' }, ({ from, to }) => from.chessboardDistance(to) === 1)
      .with({ kind: 'castling' }, () => false)
      .exhaustive()
  },
}

const _2022_06_03: Challenge = {
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
  title: 'Our Kings Almost Touched',
  link: 'https://www.youtube.com/watch?v=sEdZU-0oHdM',
  challenge: 'Chess, but if your pawn can move, it has to.',
  isMoveAllowed({ board, move }): boolean {
    // Note: per 3:02 in the video, if you're in check you can move a non-pawn (which is incidentally what this code already does.)
    const pawnMoves = legalMoves_slow(board).filter((move) => isPawn(getMovePiece(board, move)))
    return pawnMoves.length === 0 || pawnMoves.some((pawnMove) => moveIsEqual(pawnMove, move))
  },
}

const _2022_03_07: Challenge = {
  title: 'Such Torture',
  link: 'https://www.youtube.com/watch?v=IfeUGBXaOUk',
  challenge:
    'Chess, but your king is a commander, you can only move something if your king can see it.',
  isMoveAllowed({ board, move }): boolean {
    // Only pieces with distance=1 to the king are allowed to move. (1:05 in the video - line of sight doesn't count as "can see"). Unclear if castling is allowed, and theoretically it *can* happen if the opponent takes your N and B - but let's say it's not allowed.
    return (
      match(move)
        // TODO: once again we are assuming that the human is playing white
        .with({ kind: 'normal' }, ({ from }) => board.kings.white.chessboardDistance(from) <= 1)
        .with({ kind: 'enPassant' }, ({ from }) => board.kings.white.chessboardDistance(from) <= 1)
        .with({ kind: 'castling' }, () => false)
        .exhaustive()
    )
  },
}

const _2022_03_29: Challenge = {
  title: "I Don't Invade Anyone Today",
  link: 'https://www.youtube.com/watch?v=XQZFvszSddk',
  challenge: "Chess but your pawns and pieces can't cross the half-way line.",
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
  title: 'He Offered A Draw...',
  link: 'https://www.youtube.com/watch?v=kfxg5wGLVBw',
  challenge: '100 rated chess but you can only take their most extended piece or pawn.',
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
  title: 'All Predictions Went Wrong',
  link: 'https://www.youtube.com/watch?v=ZY-TiAVv69I',
  challenge: 'Chess but you have to move your King if you can.',
  isMoveAllowed({ board, move }): boolean {
    const kingMoves = legalMoves_slow(board).filter((move) => isKing(getMovePiece(board, move)))
    return kingMoves.length === 0 || kingMoves.some((kingMove) => moveIsEqual(kingMove, move))
  },
}

const _2022_09_11: Challenge = {
  title: 'I have to move the same piece as my opponent did',
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
  title: 'Chess, But Capture Is Forced',
  link: 'https://www.youtube.com/watch?v=gwKbZ_pNZ8M',
  challenge: 'Chess, but you take when you can.',
  isMoveAllowed({ board, move }): boolean {
    const captures = legalMoves_slow(board).filter((move) => isCapture(board, move))
    return captures.length === 0 || captures.some((x) => moveIsEqual(x, move))
  },
}

const _2023_06_09: Challenge = {
  title: '🏳️‍🌈 Pride Chess',
  link: 'https://www.youtube.com/watch?v=ZSlZrHFGzVU',
  challenge: 'Chess, but its Pride Month. All of your pieces (not pawns) must not move straight.',
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
