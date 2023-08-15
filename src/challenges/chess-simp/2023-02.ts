import { Challenge } from '@/challenges/core'
import { users } from '@/challenges/users'
import { getCapture } from '@/move'

export const _2023_02_23: Challenge = {
  meta: {
    uuid: 'd7e51e7a-afe6-4880-b5a5-1e5ceb4deec2',
    title: 'Highest Voted Challenge EVER',
    link: 'https://www.youtube.com/watch?v=_bVyt4Who_E',
    challenge: "Chess, but you're horny. You can only take enemy pieces (or pawns) from behind.",
    records: new Map([[users.Mendax.name, { when: new Date('2023-07-06'), depth: 1 }]]),
  },
  isMoveAllowed({ move }): boolean {
    // Note: no idea about en passant, let's just say it's not allowed.
    const capture = getCapture(move)
    return capture === null || capture.victim.y < capture.attacker.y
  },
}
