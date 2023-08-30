import { Challenge } from '@/challenges/core'
import { users } from '@/challenges/users'
import { isCapture, moveIsEqual } from '@/move'
import { legalMoves_slow } from '@/move/legal'

export class Simp_2021_12_04 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '983bb958-585c-4547-bb91-e88b6f84b9bd',
    title: 'Capture Is Forced',
    link: 'https://www.youtube.com/watch?v=gwKbZ_pNZ8M',
    challenge: 'You take when you can.',
    records: new Map([
      [users.ChessSimpSimp.name, { when: new Date('2023-06-29'), depth: 2 }],
      [users.Mendax.name, { when: new Date('2023-07-07'), depth: 3, moves: 65 }],
      [users.fextivity.name, { when: new Date('2023-08-11'), depth: 3, moves: 56 }],
      [users.Emily.name, { when: new Date('2023-08-18'), depth: 1, moves: 28 }],
      [users.Arnout.name, { when: new Date('2023-08-30'), depth: 2, moves: 22 }],
    ]),
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move }) => {
    const captures = legalMoves_slow(board).filter(isCapture)
    return captures.length === 0 || captures.some((x) => moveIsEqual(x, move))
  }
}
