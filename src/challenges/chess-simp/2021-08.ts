import { Board } from '@/board'
import { Challenge } from '@/challenges/core'
import { Move, getMoveCoords } from '@/move'
import { Color, isWhitePiece } from '@/piece'
import _ from 'lodash'
import { P, match } from 'ts-pattern'

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
