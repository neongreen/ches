import { getMovePiece } from '@/move'
import { Color, isPawn } from '@/piece'
import { match } from 'ts-pattern'
import { Challenge } from '../core'
import { users } from '../users'

export class Simp_2021_09_04 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '1c376f30-484a-428d-8831-06b2a52b2452',
    title: 'Alternate Between Moving Pawns & Pieces',
    link: 'https://www.youtube.com/watch?v=t0afNybQAcA',
    challenge: 'Chess but you have to alternate between moving a pawn and a piece.',
    records: new Map([
      [users.Emily.name, { when: new Date('2023-08-26'), depth: 2, moves: 6 }],
      [users.Mendax.name, { when: new Date('2023-08-26'), depth: 2, moves: 6 }],
      [users.Arnout.name, { when: new Date('2023-08-30'), depth: 2, moves: 8 }],
      [users.fextivity.name, { when: new Date('2023-08-31'), depth: 2, moves: 8 }],
    ]),
  }

  private allowed: 'pawn' | 'piece' | null = null

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move }) => {
    const mover = getMovePiece(board, move)
    return match(this.allowed)
      .with(null, () => true)
      .with('pawn', () => isPawn(mover))
      .with('piece', () => !isPawn(mover))
      .exhaustive()
  }

  recordMove: Challenge['recordMove'] = ({ side, boardBeforeMove, move }) => {
    if (side === Color.White) {
      const mover = getMovePiece(boardBeforeMove, move)
      this.allowed = isPawn(mover) ? 'piece' : 'pawn'
    }
  }
}
