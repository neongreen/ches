import { Challenge } from '@/challenges/core'
import { users } from '@/challenges/users'
import { getCapture } from '@/move'
import { P, match } from 'ts-pattern'

export class Simp_2022_06_03 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: 'd1a66d2b-6382-4037-9231-18f4b94cfdf8',
    title: "I Don't See Anything Wrong",
    link: 'https://www.youtube.com/watch?v=uc4gT029pNA',
    challenge:
      'Chess, but your pieces (and pawns) are always right. You cannot move them leftward.',
    records: new Map([[users.Mendax.name, { when: new Date('2023-07-02'), depth: 2 }]]),
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ move }) => {
    return match(move)
      .with({ kind: P.union('normal', 'enPassant') }, ({ from, to }) => from.x <= to.x)
      .with({ kind: 'castling' }, () => false)
      .exhaustive()
  }
}

export class Simp_2022_06_23 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '6d7428cf-ae5c-4b3e-a8ee-e435fcf40bc4',
    title: 'Poor Pawn Got Blundered 10 Times',
    link: 'https://www.youtube.com/watch?v=22D0RVwV-B0',
    challenge:
      'Chess, but your pieces need glasses. They can only capture if the target is right next to them.',
    records: new Map([
      [users.Emily.name, { when: new Date('2023-08-18'), depth: 1, moves: 13 }],
      [users.fextivity.name, { when: new Date('2023-08-18'), depth: 2, moves: 46 }],
    ]),
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ move }) => {
    // NB: pawns already can only capture if the target is right in front of them, so we don't need a check
    const capture = getCapture(move)
    return !capture || capture.attacker.kingDistance(capture.victim) === 1
  }
}
