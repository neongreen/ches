import { Challenge } from '@/challenges/core'
import { users } from '@/challenges/users'
import { getCapture } from '@/move'

export class Simp_2023_02_23 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: 'd7e51e7a-afe6-4880-b5a5-1e5ceb4deec2',
    title: 'Highest Voted Challenge EVER',
    link: 'https://www.youtube.com/watch?v=_bVyt4Who_E',
    challenge: "Chess, but you're horny. You can only take enemy pieces (or pawns) from behind.",
    records: new Map([
      [users.Mendax.name, { when: new Date('2023-08-27'), depth: 1, moves: 31 }],
      [users.Emily.name, { when: new Date('2023-08-16'), depth: 1, moves: 42 }],
      [users.fextivity.name, { when: new Date('2023-08-23'), depth: 1, moves: 39 }],
    ]),
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ move }) => {
    // Note: no idea about en passant, let's just say it's not allowed.
    const capture = getCapture(move)
    return capture === null || capture.victim.y < capture.attacker.y
  }
}
