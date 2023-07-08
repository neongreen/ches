import { P, match } from 'ts-pattern'
import { Challenge, ChallengeMeta } from './core'
import { users } from './users'
import { Uuid } from '@/utils/uuid'

class Challenge_NoGoingBackwards implements Challenge {
  meta = {
    uuid: '094fb340-016d-4a25-bad8-4b985ce81bf7',
    title: `[${users.RotomAppliance.name}] Into Battle!`,
    link: 'https://discord.com/channels/1054591816105726003/1063831721524600854/1126625935295266966',
    challenge: 'You cannot move pieces (and pawns) backwards.',
    beaten: {
      name: users.RotomAppliance.name,
      depth: 3,
      moves: 18,
    },
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ move }) => {
    return match(move)
      .with({ kind: P.union('normal', 'enPassant') }, ({ from, to }) => to.y >= from.y)
      .with({ kind: 'castling' }, () => true)
      .exhaustive()
  }
}

/**
 * Challenges from the #ches channel on Emily's Discord.
 */
export const chesDiscordChallenges: Map<Uuid, { meta: ChallengeMeta; create: () => Challenge }> =
  new Map(
    [() => new Challenge_NoGoingBackwards()].map((challengeFn) => [
      challengeFn().meta.uuid,
      { meta: challengeFn().meta, create: challengeFn },
    ])
  )
