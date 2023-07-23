import { Challenge } from '@/challenges/core'
import { users } from '@/challenges/users'
import { getAllMovers, getCapture } from '@/move'
import { Color } from '@/piece'
import { Coord } from '@/utils/coord'
import _ from 'lodash'

export class Challenge_2023_01_09 implements Challenge {
  meta = {
    uuid: 'c0133088-29de-4eb6-982e-930b270457db',
    title: 'And Then They Commit That Crime Again',
    link: 'https://www.youtube.com/watch?v=LaRsmQqEOx8',
    challenge:
      "Chess, but your pieces regret killing. After making a capture, they have to sit down and think about what they've done for 3 turns before they can move again.",
    beaten: {
      name: users.Mendax.name,
      depth: 6,
      moves: 56,
    },
  }

  private murderers: { coord: Coord; unblockedOnMoveNumber: number }[] = []

  recordMove: NonNullable<Challenge['recordMove']> = ({
    move,
    boardBeforeMove,
    boardAfterMove,
  }) => {
    const capture = getCapture(move)
    // If it was our move and it was a capture, we need to update `murderers`. If a capture happens on move N, the piece will be immobilized on moves N+123, and free again on move N+4.
    if (boardBeforeMove.side === Color.White && capture) {
      this.murderers.push({
        coord: capture.newAttackerPosition,
        unblockedOnMoveNumber: boardBeforeMove.fullMoveNumber + 4,
      })
    }
    // If our piece was captured, we have to remove it from `murderers`.
    if (boardBeforeMove.side === Color.Black && capture) {
      this.murderers = _.reject(this.murderers, (x) => x.coord.equals(capture.victim))
    }
    // Finally, some pieces might become free now.
    this.murderers = _.reject(
      this.murderers,
      (x) => x.unblockedOnMoveNumber === boardAfterMove.fullMoveNumber
    )
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ move }) => {
    const isMurderer = (x: Coord) =>
      this.murderers.some(({ coord: murderer }) => x.equals(murderer))
    return getAllMovers(move).every((mover) => !isMurderer(mover.from))
  }

  highlightSquares: NonNullable<Challenge['highlightSquares']> = ({ board }) => {
    return this.murderers.map(({ coord, unblockedOnMoveNumber }) => ({
      coord,
      color: 'red',
      text:
        unblockedOnMoveNumber - board.fullMoveNumber > 3
          ? '#'
          : (unblockedOnMoveNumber - board.fullMoveNumber).toString(),
    }))
  }
}
