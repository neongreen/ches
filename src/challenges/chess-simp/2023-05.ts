import { Board } from '@/board'
import { Challenge } from '@/challenges/core'
import { getAllMovers } from '@/move'
import { isWhitePiece } from '@/piece'
import { allConnected } from '@/utils/connected'
import { Coord } from '@/utils/coord'
import { users } from '../users'

export class Simp_2023_05_23 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '30366eaf-28ed-4d78-af5b-1fc05c544886',
    title: 'Electric Chess',
    link: 'https://www.youtube.com/watch?v=7YhDEIgfveU',
    challenge:
      "Chess, but there's electrical engineering. Your king is the battery. Your pieces+pawns cannot move unless they are connected along a chain to the king.",
    records: new Map([
      [users.QuangBuiCP.name, { when: new Date('2023-08-10'), depth: 1, moves: 17 }],
      [users.fextivity.name, { when: new Date('2023-08-10'), depth: 2, moves: 40 }],
      [users.Emily.name, { when: new Date('2023-08-15'), depth: 3, moves: 73 }],
      [users.Mendax.name, { when: new Date('2023-08-27'), depth: 3, moves: 65 }],
    ]),
  }

  private connectedPieces(board: Board): Coord[] {
    return allConnected({
      start: board.kings.white,
      neighbors: (c) => c.kingNeighbors().filter((x) => x.isValid() && isWhitePiece(board.at(x))),
      equals: (a, b) => a.equals(b),
    })
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move }) => {
    const connected = this.connectedPieces(board)
    return getAllMovers(board, move).every((mover) => connected.some((x) => x.equals(mover.from)))
  }

  highlightSquares: NonNullable<Challenge['highlightSquares']> = ({ board }) => {
    return this.connectedPieces(board).map((coord) => ({ coord, color: 'blue' }))
  }
}
