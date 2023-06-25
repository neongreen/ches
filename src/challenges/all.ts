import { chessSimpChallenges } from './chess-simp'
import { chessSimpDiscordChallenges } from './chess-simp-discord'
import { Challenge } from './core'

export const challenges: { group: string; list: Challenge[] }[] = [
  { group: 'Chess Simp', list: chessSimpChallenges },
  { group: 'Chess Simp Discord', list: chessSimpDiscordChallenges },
]
