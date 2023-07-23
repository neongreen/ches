import { Challenge } from '@/challenges/core'
import { users } from '@/challenges/users'
import { isCapture, moveIsEqual } from '@/move'
import { legalMoves_slow } from '@/move/legal'

export class Challenge_2021_12_04 implements Challenge {
  meta = {
    uuid: '983bb958-585c-4547-bb91-e88b6f84b9bd',
    title: 'Chess, But Capture Is Forced',
    link: 'https://www.youtube.com/watch?v=gwKbZ_pNZ8M',
    challenge: 'You take when you can.',
    beaten: {
      name: users.Mendax.name,
      depth: 3,
      moves: 65,
    },
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move }) => {
    const captures = legalMoves_slow(board).filter(isCapture)
    return captures.length === 0 || captures.some((x) => moveIsEqual(x, move))
  }
}
