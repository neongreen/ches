import { Challenge } from '@/challenges/core'
import { users } from '@/challenges/users'
import { P, match } from 'ts-pattern'

export const _2022_06_03: Challenge = {
  meta: {
    uuid: 'd1a66d2b-6382-4037-9231-18f4b94cfdf8',
    title: "I Don't See Anything Wrong",
    link: 'https://www.youtube.com/watch?v=uc4gT029pNA',
    challenge:
      'Chess, but your pieces (and pawns) are always right. You cannot move them leftward.',
    records: new Map([[users.Mendax.name, { when: new Date('2023-07-02'), depth: 2 }]]),
  },
  isMoveAllowed({ move }): boolean {
    return match(move)
      .with({ kind: P.union('normal', 'enPassant') }, ({ from, to }) => from.x <= to.x)
      .with({ kind: 'castling' }, () => false)
      .exhaustive()
  },
}
