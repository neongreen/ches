import { Board } from '@/board'
import { Challenge, ChallengeMeta } from '@/challenges/core'
import { Move, getCapture, getMoveCoords } from '@/move'
import { Color, isWhitePiece } from '@/piece'
import { Coord } from '@/utils/coord'
import _ from 'lodash'
import { P, match } from 'ts-pattern'
import { users } from '../users'

export class Simp_2021_08_17 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: 'ad9def81-d090-468d-91fb-58570ec87f39',
    title: 'Play On The Same File',
    link: 'https://www.youtube.com/watch?v=yyI9jKf85TY',
    challenge:
      "When your opponent's piece (or pawn) lands on a column, you must play a piece (or pawn) that is on the same column.",
    records: new Map([]),
  }

  private isColumnAllowed(data: { column: number; history: { move: Move }[] }) {
    // When the opponent does castling, we'll actually the player to use either the rook column or the king column.
    const lastMove = _.last(data.history)
    if (!lastMove) return true
    return match(lastMove.move)
      .with(
        { kind: P.union('normal', 'enPassant') },
        ({ to: lastMoveTo }) => data.column === lastMoveTo.x
      )
      .with(
        { kind: 'castling' },
        ({ kingTo: lastMoveKingTo, rookTo: lastMoveRookTo }) =>
          data.column === lastMoveKingTo.x || data.column === lastMoveRookTo.x
      )
      .exhaustive()
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ history, move }) => {
    return this.isColumnAllowed({ column: getMoveCoords(move).from.x, history })
  }

  highlightSquares: NonNullable<Challenge['highlightSquares']> = ({ history, board }) => {
    if (history.length === 0) return [] // No highlight on first move
    if (board.side === Color.Black) return []
    return Board.allSquares()
      .filter(
        (square) =>
          isWhitePiece(board.at(square)) && this.isColumnAllowed({ column: square.x, history })
      )
      .map((square) => ({ coord: square, color: 'blue' }))
  }
}

export class Simp_2021_08_31 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '2b68e7eb-24fe-43f0-a675-7e914566403a',
    title: 'Odd Numbered Rank',
    link: 'https://www.youtube.com/watch?v=PDB2miuFEIY',
    challenge: 'If a piece (or a pawn) is captured on an uneven numbered rank, the video ends.',
    records: new Map([
      [users.Arnout.name, { when: new Date('2023-09-11'), depth: 3, moves: 71 }],
      [users.Mendax.name, { when: new Date('2023-09-12'), depth: 4, moves: 77 }],
    ]),
  }

  private bad = (coord: Coord) => coord.y % 2 === 0

  highlightSquares: NonNullable<Challenge['highlightSquares']> = ({ board }) => {
    return Board.allSquares()
      .filter(this.bad)
      .map((coord) => ({ coord, color: 'lightRed' }))
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ move, board }) => {
    const capture = getCapture(move)
    return !(capture && this.bad(capture.victim))
  }

  isChallengeLost: NonNullable<Challenge['isChallengeLost']> = ({ board }) => {
    const lastMove = _.last(board.moveHistory)
    if (!lastMove) return { lost: false }
    const capture = getCapture(lastMove)
    if (capture && this.bad(capture.victim)) {
      return { lost: true }
    } else {
      return { lost: false }
    }
  }
}
