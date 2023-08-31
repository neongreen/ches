import { Coord } from '@/utils/coord'
import { Challenge } from './core'
import { getAllMovers } from '@/move'
import { isPawn } from '@/piece'
import { Uuid } from '@/utils/uuid'
import { users } from './users'

export class Challenge_NoFFile implements Challenge {
  meta: Challenge['meta'] = {
    uuid: 'c0b4386e-3dcf-43f3-87fa-71f7255172b7',
    title: 'Win without using the F-file',
    link: 'https://www.youtube.com/watch?v=RS-Y8Xnu8yQ',
    challenge:
      'You hate the F-file. None of your pieces may enter the F-file. Pawns are okay though.',
    records: new Map([
      [users.Emily.name, { when: new Date('2023-08-16'), depth: 3, moves: 64 }],
      [users.fextivity.name, { when: new Date('2023-08-17'), depth: 3, moves: 54 }],
      [users.Mendax.name, { when: new Date('2023-08-27'), depth: 4, moves: 52 }],
      [users.Arnout.name, { when: new Date('2023-08-31'), depth: 4, moves: 28 }],
    ]),
  }

  highlightSquares: Challenge['highlightSquares'] = () => {
    return Array.from({ length: 8 }, (_, i) => {
      return { color: 'lightRed', coord: new Coord(5, i) }
    })
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ move, board }) => {
    return getAllMovers(board, move).every((mover) => isPawn(mover.pieceAfter) || mover.to.x !== 5)
  }
}

export const chessbrahChallenges: Map<Uuid, { meta: Challenge['meta']; create: () => Challenge }> =
  new Map(
    [() => new Challenge_NoFFile()].map((challengeFn) => [
      challengeFn().meta.uuid,
      { meta: challengeFn().meta, create: challengeFn },
    ])
  )
