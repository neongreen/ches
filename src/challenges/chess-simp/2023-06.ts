import { Challenge } from '@/challenges/core'
import { users } from '@/challenges/users'
import { getMovePiece } from '@/move'
import { isPawn } from '@/piece'
import { P, match } from 'ts-pattern'

export const _2023_06_09: Challenge = {
  meta: {
    uuid: 'a96dab9f-3a86-4ec9-a754-c9ca0cabd1e0',
    title: '🏳️‍🌈 Pride Chess',
    link: 'https://www.youtube.com/watch?v=ZSlZrHFGzVU',
    challenge: 'Chess, but its Pride Month. All of your pieces (not pawns) must not move straight.',
    beaten: {
      name: users.Mendax.name,
      depth: 4,
    },
  },

  isMoveAllowed({ board, move }): boolean {
    return match(move)
      .with(
        { kind: P.union('normal', 'enPassant') },
        ({ from, to }) => isPawn(getMovePiece(board, move)) || (from.x !== to.x && from.y !== to.y)
      )
      .with({ kind: 'castling' }, () => false)
      .exhaustive()
  },
}
