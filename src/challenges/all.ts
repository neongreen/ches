import { mapValues, mergeMapsEnsureDistinct } from '@/utils/map'
import { Uuid } from '@/utils/uuid'
import { chessSimpChallenges } from './chess-simp'
import { chessSimpDiscordChallenges } from './chess-simp-discord'
import { Challenge, ChallengeMeta } from './core'
import { chesDiscordChallenges } from './ches-discord'
import { chessbrahChallenges } from './chessbrah'

export const challengesList: {
  group: string
  list: Map<Uuid, { meta: ChallengeMeta; create: () => Challenge }>
}[] = [
  { group: '⭐️ Ches Discord', list: chesDiscordChallenges },
  { group: 'Chess Simp', list: chessSimpChallenges },
  { group: 'Chess Simp Discord', list: chessSimpDiscordChallenges },
  { group: 'Chessbrah', list: chessbrahChallenges },
]

export const challengesMap: Map<
  Uuid,
  { group: string; meta: ChallengeMeta; create: () => Challenge }
> = mergeMapsEnsureDistinct(
  challengesList.map(({ group, list }) => mapValues(list, (challenge) => ({ group, ...challenge })))
)
