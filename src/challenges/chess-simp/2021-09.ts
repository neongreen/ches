import { match } from 'ts-pattern'
import { Challenge } from '../core'
import { Color, isPawn, isWhitePiece } from '@/piece'
import { getMovePiece } from '@/move'

export class Simp_2021_09_04 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '1c376f30-484a-428d-8831-06b2a52b2452',
    title: 'Alternate Between Moving Pawns & Pieces',
    link: 'https://www.youtube.com/watch?v=t0afNybQAcA',
    challenge: 'Chess but you have to alternate between moving a pawn and a piece.',
    records: new Map([]),
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

  recordMove: Challenge['recordMove'] = ({ boardBeforeMove, move }) => {
    if (boardBeforeMove.side === Color.White) {
      const mover = getMovePiece(boardBeforeMove, move)
      this.allowed = isPawn(mover) ? 'piece' : 'pawn'
    }
  }
}
