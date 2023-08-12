import { Challenge } from '@/challenges/core'
import { users } from '@/challenges/users'
import { getCapture, getMovePiece } from '@/move'
import { Piece, pieceType } from '@/piece'
import _ from 'lodash'
import { P, match } from 'ts-pattern'

export class Challenge_2022_09_11 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '9b88d4dd-e1fe-4120-9792-c2ff15fd5920',
    title: 'I Have To Move The Same Piece As My Opponent Did',
    link: 'https://www.youtube.com/watch?v=jAkBGHEptQQ',
    challenge:
      'Chess, but you have to move the same piece (or pawn) as your opponent did last move.',
    beaten: {
      name: users.ManosSef.name,
      depth: 1,
    },
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ history, board, move }) => {
    // Note: if playing as white, we allow any move. Unfortunately, the video didn't cover castling. Let's just say castling is a king move.
    const lastMove = _.last(history)
    return (
      lastMove === undefined ||
      pieceType(getMovePiece(lastMove.boardBeforeMove, lastMove.move)) ===
        pieceType(getMovePiece(board, move))
    )
  }
}

export class Challenge_2022_09_26 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '3b89e3e6-7551-4d8a-850f-9ac6d380011e',
    title: 'My Favorite Opening',
    link: 'https://www.youtube.com/watch?v=OSCDE_ebc1c',
    challenge:
      'Chess, but your pieces (and pawns) are vampires. They cannot step into the light (squares).',
    beaten: {
      name: users.fextivity.name,
      depth: 2,
      moves: 41,
    },
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ move }) => {
    // Can only move to dark squares.
    return match(move)
      .with({ kind: P.union('normal', 'enPassant') }, ({ to }) => to.color() === 'dark')
      .with(
        { kind: 'castling' },
        ({ kingTo, rookTo }) => kingTo.color() === 'dark' && rookTo.color() === 'dark'
      )
      .exhaustive()
  }
}

export class Challenge_2022_09_19 implements Challenge {
  meta = {
    uuid: '52620ef2-a11c-4b1c-bb40-652a482ba724',
    title: 'The Entire Game Were BLUNDERS !!!',
    link: 'https://www.youtube.com/watch?v=TRkyi_i6EqY',
    challenge:
      'Chess, but your pawns are plotting against you, you need to get rid of them before making any captures.',
    beaten: {
      name: users.fextivity.name,
      depth: 2,
      moves: 22,
    },
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move }) => {
    const capture = getCapture(move)
    const noPawnsLeft = board.pieces().every(({ piece }) => piece !== Piece.WhitePawn)
    return capture ? noPawnsLeft : true
  }
}
