import { Challenge } from '@/challenges/core'
import { users } from '@/challenges/users'
import { getMovePiece, moveIsEqual } from '@/move'
import { legalMoves_slow } from '@/move/legal'
import { isKing, pieceType } from '@/piece'
import _ from 'lodash'

export const _2022_04_21: Challenge = {
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

export const _2022_09_11: Challenge = {
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
