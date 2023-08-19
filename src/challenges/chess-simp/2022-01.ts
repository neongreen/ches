import { Board } from '@/board'
import { Challenge } from '@/challenges/core'
import { users } from '@/challenges/users'
import { getMovePiece, moveIsEqual } from '@/move'
import { legalMoves_slow } from '@/move/legal'
import { Color, Piece, isPawn } from '@/piece'
import { Coord } from '@/utils/coord'
import { is } from 'ramda'

export class Simp_2022_01_29 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '1515dfc7-4ed7-444d-a8cb-ac6b35e699bd',
    title: 'Our Kings Almost Touched',
    link: 'https://www.youtube.com/watch?v=sEdZU-0oHdM',
    challenge: 'Chess, but if your pawn can move, it has to.',
    records: new Map([
      [users.Mendax.name, { when: new Date('2023-07-07'), depth: 3, moves: 64 }],
      [users.fextivity.name, { when: new Date('2023-08-15'), depth: 2, moves: 25 }],
      [users.Emily.name, { when: new Date('2023-08-18'), depth: 2, moves: 25 }],
    ]),
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move }) => {
    // Note: per 3:02 in the video, if you're in check you can move a non-pawn (which is incidentally what this code already does.)
    const pawnMoves = legalMoves_slow(board).filter((move) => isPawn(getMovePiece(board, move)))
    return pawnMoves.length === 0 || pawnMoves.some((pawnMove) => moveIsEqual(pawnMove, move))
  }
}

export class Simp_2022_01_21 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '3a782e75-ba6d-48ea-b3b0-b9c6b268bd27',
    title: 'This Is A Bit Too Aggressive',
    link: 'https://www.youtube.com/watch?v=5yRrvhY_DEI',
    challenge: 'Chess, but your Queen is always in the center. (Challenge starts from move 2.)',
    records: new Map([]),
  }

  private isInCenter = (coord: Coord) =>
    coord.x >= 2 && coord.x <= 5 && coord.y >= 2 && coord.y <= 5

  isChallengeLost: NonNullable<Challenge['isChallengeLost']> = ({ board }) => {
    const queens = board.pieces().filter((x) => x.piece === Piece.WhiteQueen)
    return { lost: board.halfMoveNumber >= 4 && !queens.some((x) => this.isInCenter(x.coord)) }
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move }) => {
    const boardAfterMove = board.clone()
    boardAfterMove.executeMove(move)
    return !this.isChallengeLost({ board: boardAfterMove }).lost
  }

  highlightSquares: Challenge['highlightSquares'] = ({ board }) => {
    return Board.allSquares()
      .filter((coord) => this.isInCenter(coord))
      .map((coord) => ({ coord, color: 'lightYellow' }))
  }
}
