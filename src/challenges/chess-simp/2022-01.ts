import { Challenge } from '@/challenges/core'
import { users } from '@/challenges/users'
import { getMovePiece, moveIsEqual } from '@/move'
import { legalMoves_slow } from '@/move/legal'
import { isPawn } from '@/piece'

export class Challenge_2022_01_29 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '1515dfc7-4ed7-444d-a8cb-ac6b35e699bd',
    title: 'Our Kings Almost Touched',
    link: 'https://www.youtube.com/watch?v=sEdZU-0oHdM',
    challenge: 'Chess, but if your pawn can move, it has to.',
    records: new Map([[users.Mendax.name, { when: new Date('2023-07-07'), depth: 3, moves: 64 }]]),
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move }) => {
    // Note: per 3:02 in the video, if you're in check you can move a non-pawn (which is incidentally what this code already does.)
    const pawnMoves = legalMoves_slow(board).filter((move) => isPawn(getMovePiece(board, move)))
    return pawnMoves.length === 0 || pawnMoves.some((pawnMove) => moveIsEqual(pawnMove, move))
  }
}
