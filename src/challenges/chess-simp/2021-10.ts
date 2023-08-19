import { Challenge } from '@/challenges/core'
import { getCapture, getMovePiece } from '@/move'
import { Piece, isKing } from '@/piece'
import _ from 'lodash'
import { users } from '../users'
import { Coord } from '@/utils/coord'

export class Simp_2021_10_22 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '8c0bd7f7-01be-4862-842f-4ad43c3ffb01',
    title: 'If A King Moves, The Video Ends',
    link: 'https://www.youtube.com/watch?v=3_AGsjT_dVI',
    challenge: 'If a king moves, the video ends (castling also counts).',
    records: new Map([]),
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move }) => {
    const piece = getMovePiece(board, move)
    return !isKing(piece)
  }

  isChallengeLost: Challenge['isChallengeLost'] = ({ board }) => {
    const whiteKingMoved = !board.kings.white.equals(new Coord(4, 0))
    const blackKingMoved = !board.kings.black.equals(new Coord(4, 7))
    return { lost: whiteKingMoved || blackKingMoved }
  }
}

export class Simp_2021_10_16 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: 'cbd25aaa-a414-4248-a24e-58679c07588c',
    title: "Chess, But I'm A Real SIMP",
    link: 'https://www.youtube.com/watch?v=GLMMLc879Ho',
    challenge:
      'Chess, but you have to move your King everytime your opponent moves his Queen. Also, you cannot take his Queen.',
    records: new Map([
      [users.Emily.name, { when: new Date('2023-08-18'), depth: 4, moves: 30 }],
      [users.fextivity.name, { when: new Date('2023-08-18'), depth: 3, moves: 30 }],
    ]),
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move, history }) => {
    // If the last move was a queen move, yours *has* to be a king move
    const lastMove = _.last(history)
    if (
      lastMove &&
      getMovePiece(lastMove.boardBeforeMove, lastMove.move) === Piece.BlackQueen &&
      getMovePiece(board, move) !== Piece.WhiteKing
    )
      return false

    // You cannot capture queens. Simp probably meant "there has to be at least one queen" or "you can't capture the original queen but promoted queens are ok", but it's not specified in the video, so let's say "any queen".
    const capture = getCapture(move)
    if (capture && capture.victimPiece === Piece.BlackQueen) return false

    // All good
    return true
  }

  highlightSquares: Challenge['highlightSquares'] = ({ board, history }) => {
    // Highlight the king, if it has to be moved
    const lastMove = _.last(history)
    if (lastMove && getMovePiece(lastMove.boardBeforeMove, lastMove.move) === Piece.BlackQueen) {
      return [{ coord: board.kings.white, color: 'blue' }]
    } else {
      return []
    }
  }
}
