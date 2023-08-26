import { Challenge } from '@/challenges/core'
import { users } from '@/challenges/users'
import { getAllMovers, getCapture, getMovePiece } from '@/move'
import { Color, isPawn } from '@/piece'
import _ from 'lodash'

export class Simp_2022_02_10 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '934f5a6b-c5af-48b5-ac4f-bc4ba3cc3c31',
    title: 'I Moved Pawns 100 Times',
    link: 'https://www.youtube.com/watch?v=lco2G0Ri-DM',
    challenge: 'If your opponent moves a piece, you move a pawn, and vice versa.',
    records: new Map([
      [users.Mendax.name, { when: new Date('2023-08-23'), depth: 2, moves: 10 }],
      [users.Emily.name, { when: new Date('2023-08-16'), depth: 2, moves: 12 }],
      [users.fextivity.name, { when: new Date('2023-08-20'), depth: 1, moves: 31 }],
    ]),
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ history, board, move }) => {
    const lastMove = _.last(history)
    if (!lastMove) return true
    const lastMoveIsPawn = isPawn(getMovePiece(lastMove.boardBeforeMove, lastMove.move))
    const currentMoveIsPawn = isPawn(getMovePiece(board, move))
    return lastMoveIsPawn !== currentMoveIsPawn
  }
}

export class Simp_2022_02_11 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '466a483a-5db4-447e-96e4-0b2deb674ac6',
    title: '8 Book Moves???',
    link: 'https://www.youtube.com/watch?v=v0xSoAnUPlI',
    challenge: "Chess, but you can't capture a piece (not pawn) the turn after it moves.",
    records: new Map([
      [users.Emily.name, { when: new Date('2023-07-23'), depth: 3, moves: 27 }],
      [users.fextivity.name, { when: new Date('2023-08-15'), depth: 2, moves: 35 }],
      [users.Mendax.name, { when: new Date('2023-08-25'), depth: 4, moves: 42 }],
    ]),
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ history, move }) => {
    const lastMove = _.last(history)
    if (!lastMove) return true
    const capture = getCapture(move)
    if (!capture || isPawn(capture.victimPiece)) return true
    return !getAllMovers(lastMove.boardBeforeMove, lastMove.move).some((mover) =>
      mover.to.equals(capture.victim)
    )
  }

  highlightSquares: NonNullable<Challenge['highlightSquares']> = ({ history, board }) => {
    if (board.side !== Color.White) return []
    const lastMove = _.last(history)
    if (!lastMove) return []
    return getAllMovers(lastMove.boardBeforeMove, lastMove.move)
      .filter((mover) => !isPawn(board.at(mover.to)))
      .map((mover) => ({ coord: mover.to, color: 'red' }))
  }
}
