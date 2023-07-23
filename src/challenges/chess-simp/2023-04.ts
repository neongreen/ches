import { Challenge } from '@/challenges/core'
import { users } from '@/challenges/users'
import { pieceValue } from '@/eval/material'
import { getCapture } from '@/move'
import { Color } from '@/piece'

export class Challenge_2023_04_01 implements Challenge {
  meta = {
    uuid: '3f7fe35d-6811-4ed5-a498-e820aedd2587',
    title: 'Easiest Win of This Channel',
    link: 'https://www.youtube.com/watch?v=NSyf4uVbn7c',
    challenge:
      'Chess but you can only capture pieces which worth more or equal points than the piece you captured before it.',
    beaten: {
      name: users.Mendax.name,
      depth: 3,
    },
  }

  private minCaptureValue = 0

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move }) => {
    const capture = getCapture(move)
    if (!capture) return true
    return pieceValue(board.at(capture.victim)) >= this.minCaptureValue
  }

  recordMove: NonNullable<Challenge['recordMove']> = ({ boardBeforeMove, move }) => {
    const capture = getCapture(move)
    if (boardBeforeMove.side === Color.White && capture) {
      this.minCaptureValue = pieceValue(boardBeforeMove.at(capture.victim))
    }
  }
}
