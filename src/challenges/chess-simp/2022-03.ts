import { Board } from '@/board'
import { Challenge } from '@/challenges/core'
import { users } from '@/challenges/users'
import { isWhitePiece } from '@/piece'
import { Coord } from '@/utils/coord'
import { P, match } from 'ts-pattern'

export class Challenge_2022_03_07 implements Challenge {
  meta = {
    uuid: '7f577d60-083c-47fe-a335-3a4ee406f5c8',
    title: 'Such Torture',
    link: 'https://www.youtube.com/watch?v=IfeUGBXaOUk',
    challenge:
      'Chess, but your king is a commander, you can only move something if your king can see it.',
    beaten: {
      name: users.Emily.name,
      depth: 2,
    },
  }

  private kingSees = (data: { board: Board; square: Coord }) => {
    // Only pieces with distance=1 to the king are allowed to move. (1:05 in the video - line of sight doesn't count as "can see").
    // TODO: once again we are assuming that the human is playing white
    return data.board.kings.white.kingDistance(data.square) === 1
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move }) => {
    // Note: unclear if castling is allowed, and theoretically it *can* happen if the opponent takes your N and B - but let's say it's not allowed.
    return match(move)
      .with(
        { kind: P.union('normal', 'enPassant') },
        ({ from }) => from.equals(board.kings.white) || this.kingSees({ board, square: from })
      )
      .with({ kind: 'castling' }, () => false)
      .exhaustive()
  }

  highlightSquares: Challenge['highlightSquares'] = ({ board }) => {
    return Board.allSquares()
      .filter((square) => isWhitePiece(board.at(square)) && this.kingSees({ board, square }))
      .map((coord) => ({ color: 'blue', coord }))
  }
}

export class Challenge_2022_03_29 implements Challenge {
  meta = {
    uuid: '8f5b6f38-8426-430f-a2ce-698b401a43eb',
    title: "I Don't Invade Anyone Today",
    link: 'https://www.youtube.com/watch?v=XQZFvszSddk',
    challenge: "Chess but your pawns and pieces can't cross the half-way line.",
    beaten: {
      name: users.Mendax.name,
      depth: 3,
    },
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ move }) => {
    return (
      match(move)
        // TODO: once again we are assuming that the human is playing white
        .with({ kind: P.union('normal', 'enPassant') }, ({ to }) => to.y <= 3)
        .with({ kind: 'castling' }, () => true)
        .exhaustive()
    )
  }
}