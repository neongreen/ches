import { Board } from '@/board'
import { Challenge } from '@/challenges/core'
import { users } from '@/challenges/users'
import { getAllMovers, getMoveCoords, getMovePiece, moveIsEqual } from '@/move'
import { legalMoves_slow } from '@/move/legal'
import { Color, isKing } from '@/piece'
import { match } from 'ts-pattern'

export class Simp_2022_04_21 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '5101988d-c2c1-4585-96b7-06aa04d599fd',
    title: 'All Predictions Went Wrong',
    link: 'https://www.youtube.com/watch?v=ZY-TiAVv69I',
    challenge: 'Chess but you have to move your King if you can.',
    records: new Map([
      [users.Mendax.name, { when: new Date('2023-07-02'), depth: 3 }],
      [users.Emily.name, { when: new Date('2023-08-18'), depth: 2, moves: 48 }],
      [users.fextivity.name, { when: new Date('2023-08-21'), depth: 1, moves: 31 }],
    ]),
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move }) => {
    const kingMoves = legalMoves_slow(board).filter((move) => isKing(getMovePiece(board, move)))
    return kingMoves.length === 0 || kingMoves.some((kingMove) => moveIsEqual(kingMove, move))
  }
}

export class Simp_2022_04_22 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '91fd101e-bd0e-47da-ab8e-a6fb7972a1a2',
    title: "It Was So Hard I Couldn't Breath",
    link: 'https://www.youtube.com/watch?v=N3hTb-Ifg0M',
    challenge:
      'Chess but you can only use half of the board, every 5 moves you have to switch to the other half.',
    records: new Map([
      [users.fextivity.name, { when: new Date('2023-08-14'), depth: 3, moves: 64 }],
      [users.Emily.name, { when: new Date('2023-08-18'), depth: 1, moves: 48 }],
      [users.Mendax.name, { when: new Date('2023-08-25'), depth: 3, moves: 28 }],
    ]),
  }

  private allowedSide: 'kingside' | 'queenside' | 'any' = 'any'

  recordMove: Challenge['recordMove'] = ({ move, boardBeforeMove, side }) => {
    // If it's the first ever move, we determine the side
    if (boardBeforeMove.fullMoveNumber === 1 && side === Color.White) {
      this.allowedSide = getMoveCoords(move).from.x < 4 ? 'queenside' : 'kingside'
    }
    // If it was black's move 5, 10, 15, etc, we have to switch sides
    if (side === Color.Black && boardBeforeMove.fullMoveNumber % 5 === 0) {
      match(this.allowedSide)
        .with('any', () => {
          throw new Error('impossible: after the first move the side should be determined')
        })
        .with('kingside', () => {
          this.allowedSide = 'queenside'
        })
        .with('queenside', () => {
          this.allowedSide = 'kingside'
        })
        .exhaustive()
    }
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move }) => {
    return getAllMovers(board, move).every((mover) =>
      match(this.allowedSide)
        .with('any', () => true)
        .with('kingside', () => mover.from.x >= 4)
        .with('queenside', () => mover.from.x < 4)
        .exhaustive()
    )
  }

  highlightSquares: Challenge['highlightSquares'] = () => {
    const squares = match(this.allowedSide)
      .with('any', () => [])
      .with('kingside', () => Board.allSquares().filter((coord) => coord.x >= 4))
      .with('queenside', () => Board.allSquares().filter((coord) => coord.x < 4))
      .exhaustive()
    return squares.map((coord) => ({ coord, color: 'lightYellow' }))
  }
}
