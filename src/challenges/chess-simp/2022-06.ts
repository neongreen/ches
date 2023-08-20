import { Board } from '@/board'
import { Challenge } from '@/challenges/core'
import { users } from '@/challenges/users'
import { getCapture, getMoveCoords, getMovePiece, moveIsEqual } from '@/move'
import { legalMoves_slow } from '@/move/legal'
import { Color, isBlackPiece, isPawn, isWhitePiece } from '@/piece'
import { P, match } from 'ts-pattern'

export class Simp_2022_06_03 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: 'd1a66d2b-6382-4037-9231-18f4b94cfdf8',
    title: "I Don't See Anything Wrong",
    link: 'https://www.youtube.com/watch?v=uc4gT029pNA',
    challenge:
      'Chess, but your pieces (and pawns) are always right. You cannot move them leftward.',
    records: new Map([[users.Mendax.name, { when: new Date('2023-07-02'), depth: 2 }]]),
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ move }) => {
    return match(move)
      .with({ kind: P.union('normal', 'enPassant') }, ({ from, to }) => from.x <= to.x)
      .with({ kind: 'castling' }, () => false)
      .exhaustive()
  }
}

export class Simp_2022_06_23 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '6d7428cf-ae5c-4b3e-a8ee-e435fcf40bc4',
    title: 'Poor Pawn Got Blundered 10 Times',
    link: 'https://www.youtube.com/watch?v=22D0RVwV-B0',
    challenge:
      'Chess, but your pieces need glasses. They can only capture if the target is right next to them.',
    records: new Map([
      [users.Emily.name, { when: new Date('2023-08-18'), depth: 1, moves: 13 }],
      [users.fextivity.name, { when: new Date('2023-08-18'), depth: 2, moves: 46 }],
    ]),
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ move }) => {
    // NB: pawns already can only capture if the target is right in front of them, so we don't need a check
    const capture = getCapture(move)
    return !capture || capture.attacker.kingDistance(capture.victim) === 1
  }
}

export class Simp_2022_06_21 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '748d2f26-737a-46da-b906-cea510a0f34b',
    title: 'That Was Frustrating',
    link: 'https://www.youtube.com/watch?v=wb9JmQMOG7U',
    challenge:
      'Chess, but if your piece (not pawn) can get directly behind the enemy piece (not pawn), it has to.',
    records: new Map([
      [users.fextivity.name, { when: new Date('2023-08-20'), depth: 2, moves: 6 }],
    ]),
  }

  private movesBehind(board: Board) {
    return legalMoves_slow(board).filter((move) => {
      // Castling never counts so we can just use the primary mover
      const piece = getMovePiece(board, move)
      const behind = board.at(getMoveCoords(move).to.s())
      return isWhitePiece(piece) && !isPawn(piece) && isBlackPiece(behind) && !isPawn(behind)
    })
  }

  highlightSquares: Challenge['highlightSquares'] = ({ board }) => {
    if (board.side === Color.White) {
      return this.movesBehind(board).map((move) => ({
        coord: getMoveCoords(move).to,
        color: 'blue',
      }))
    } else {
      return []
    }
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move }) => {
    const moves = this.movesBehind(board)
    return moves.length === 0 || moves.some((m) => moveIsEqual(m, move))
  }
}
