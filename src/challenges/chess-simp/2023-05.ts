import { Board } from '@/board'
import { Challenge } from '@/challenges/core'
import { getAllMovers } from '@/move'
import { isWhitePiece } from '@/piece'
import { allConnected } from '@/utils/connected'
import { Coord } from '@/utils/coord'

export class Challenge_2023_05_23 implements Challenge {
  meta = {
    uuid: '30366eaf-28ed-4d78-af5b-1fc05c544886',
    title: 'Electric Chess',
    link: 'https://www.youtube.com/watch?v=7YhDEIgfveU',
    challenge:
      "Chess, but there's electrical engineering. Your king is the battery. Your pieces+pawns cannot move unless they are connected along a chain to the king.",
  }

  private connectedPieces(board: Board): Coord[] {
    return allConnected({
      start: board.kings.white,
      neighbors: (c) =>
        [c.n(), c.s(), c.e(), c.w(), c.ne(), c.nw(), c.se(), c.sw()].filter(
          (x) => x.isValid() && isWhitePiece(board.at(x))
        ),
      equals: (a, b) => a.equals(b),
    })
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move }) => {
    const movers = getAllMovers(move)
    const connected = this.connectedPieces(board)
    return movers.every((mover) => connected.some((x) => x.equals(mover.from)))
  }

  highlightSquares: NonNullable<Challenge['highlightSquares']> = ({ board }) => {
    return this.connectedPieces(board).map((coord) => ({ coord, color: 'blue' }))
  }
}
