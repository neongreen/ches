import _ from 'lodash'
import { Challenge } from '../core'
import { getMoveCoords, getMovePiece } from '@/move'
import { Piece, isWhitePiece } from '@/piece'
import { Board } from '@/board'
import { legalMovesForPiece_slow } from '@/move/legal'
import { users } from '../users'

export class Challenge_2022_07_18 implements Challenge {
  meta = {
    uuid: 'a2d24a1c-9ed1-4a96-8479-3b0042b46f9e',
    title: 'King Simp Today',
    link: 'https://www.youtube.com/watch?v=pQsTknAm604',
    challenge:
      'Ches, but every time your opponent moves their Queen, you move your King closer to their Queen.',
    beaten: {
      name: users.fextivity.name,
      depth: 2,
      moves: 63,
    },
  }

  // At 1:18 in the video, Simp has just gone Ke7 and the queen is at e2:
  //
  //  1 RN-K-BNR
  //  2 PPPQPPPP
  //  3 ------B-
  //  4 ---p----
  //  5 --------
  //  6 ---p----
  //  7 pppk-ppp
  //  8 rnb-qbnr
  //    ^^^^^^^^
  //    hgfedcba
  //
  // Simp contemplates: "actually I should've gone Kd7, because then after Qxe4 I could've gone Ke7". The king's distance to the queen is 3 in either case. This means that Simp isn't using king's distance, but likely Pythagorean distance.
  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move, history }) => {
    const lastMove = _.last(history)
    if (!lastMove) return true
    if (getMovePiece(lastMove.boardBeforeMove, lastMove.move) !== Piece.BlackQueen) return true
    const queenCoord = getMoveCoords(lastMove.move).to
    const { from, to } = getMoveCoords(move)
    const mover = getMovePiece(board, move)
    return (
      mover === Piece.WhiteKing &&
      queenCoord.pythagoreanDistance(to) < queenCoord.pythagoreanDistance(from)
    )
  }

  // Highlight all squares that the king can move to (and that are closer than before).
  highlightSquares: Challenge['highlightSquares'] = ({ board, history }) => {
    const lastMove = _.last(history)
    if (!lastMove) return []
    if (getMovePiece(lastMove.boardBeforeMove, lastMove.move) !== Piece.BlackQueen) return []
    const queenCoord = getMoveCoords(lastMove.move).to
    return legalMovesForPiece_slow(board, board.kings.white)
      .map(getMoveCoords)
      .filter(
        ({ from, to }) => queenCoord.pythagoreanDistance(to) < queenCoord.pythagoreanDistance(from)
      )
      .map(({ to }) => ({ coord: to, color: 'blue' }))
  }
}
