import _ from 'lodash'
import { Challenge, ChallengeMeta } from '../core'
import { getAllMovers, getCapture, getMoveCoords, getMovePiece } from '@/move'
import { Color, Piece, isBlackPiece, isPawn, isWhitePiece } from '@/piece'
import { Board } from '@/board'
import { legalMovesForPiece_slow } from '@/move/legal'
import { users } from '../users'
import { Coord } from '@/utils/coord'

export class Challenge_2022_07_18 implements Challenge {
  meta = {
    uuid: 'a2d24a1c-9ed1-4a96-8479-3b0042b46f9e',
    title: 'King Simp Today',
    link: 'https://www.youtube.com/watch?v=pQsTknAm604',
    challenge:
      'Ches, but every time your opponent moves their Queen, you move your King closer to their Queen.',
    beaten: {
      name: users.fextivity.name,
      depth: 3,
      moves: 55,
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

export class Challenge_2022_07_11 implements Challenge {
  meta: ChallengeMeta = {
    uuid: 'acd79149-c5f9-47e6-a778-780e631f7bd9',
    title: 'What Was I Doing??',
    link: 'https://www.youtube.com/watch?v=gNR9eO6V9yg',
    challenge:
      'Chess, but if an enemy piece (not pawn) touches your piece (not pawn), yours can never move ever again.',
  }

  private touchedPieces: Coord[] = []

  recordMove: Challenge['recordMove'] = ({ move, boardAfterMove, boardBeforeMove }) => {
    // Remove all pieces that were captured
    const capture = getCapture(move)
    if (capture) {
      this.touchedPieces = this.touchedPieces.filter((coord) => !coord.equals(capture.victim))
    }

    // Mark all pieces currently touching black pieces as unavailable
    for (const square of Board.allSquares()) {
      if (this.touchedPieces.some((coord) => coord.equals(square))) continue
      const piece = boardAfterMove.at(square)
      if (isWhitePiece(piece) && !isPawn(piece)) {
        const neighbors = square.kingNeighbors().map((coord) => boardAfterMove.at(coord))
        if (neighbors.some((neighbor) => isBlackPiece(neighbor) && !isPawn(neighbor))) {
          this.touchedPieces.push(square)
        }
      }
    }
  }

  highlightSquares: Challenge['highlightSquares'] = () => {
    return this.touchedPieces.map((coord) => ({ coord, color: 'red' }))
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ move, board }) => {
    if (board.side === Color.Black) return true
    return getAllMovers(move).every((mover) =>
      this.touchedPieces.every((touched) => !touched.equals(mover.from))
    )
  }
}
