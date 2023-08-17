import { Challenge } from '@/challenges/core'
import { users } from '@/challenges/users'
import { getAllMovers, getCapture, getMovePiece } from '@/move'
import { Piece, isPawn, pieceType } from '@/piece'
import { Coord } from '@/utils/coord'
import _ from 'lodash'
import { P, match } from 'ts-pattern'

export class Challenge_2022_09_11 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '9b88d4dd-e1fe-4120-9792-c2ff15fd5920',
    title: 'I Have To Move The Same Piece As My Opponent Did',
    link: 'https://www.youtube.com/watch?v=jAkBGHEptQQ',
    challenge:
      'Chess, but you have to move the same piece (or pawn) as your opponent did last move.',
    records: new Map([[users.ManosSef.name, { when: new Date('2023-07-02'), depth: 1 }]]),
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
    records: new Map([
      [users.Mendax.name, { when: new Date('2023-07-02'), depth: 1 }],
      [users.fextivity.name, { when: new Date('2023-08-10'), depth: 2, moves: 41 }],
    ]),
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

export class Challenge_2022_09_29 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: 'd6006531-5a50-4c3b-b0f1-7d1927025f71',
    title: 'Too Convenient',
    link: 'https://www.youtube.com/watch?v=veXnLFejUd8',
    challenge:
      'Chess, but your pieces are afraid of landmines. They can only move to squares that have been walked on by your pawns.',
    records: new Map([
      [users.fextivity.name, { when: new Date('2023-08-17'), depth: 2, moves: 34 }],
    ]),
  }

  // Pieces can also go back to their original positions (4:06 in the video) and to the initial pawn positions
  private goodSquares: Coord[] = Array.from({ length: 8 }, (_, x) => [
    new Coord(x, 0),
    new Coord(x, 1),
  ]).flat()

  recordMove: Challenge['recordMove'] = ({ boardAfterMove }) => {
    for (const { piece, coord } of boardAfterMove.pieces()) {
      if (piece === Piece.WhitePawn && !this.goodSquares.some((c) => c.equals(coord))) {
        this.goodSquares.push(coord)
      }
    }
  }

  highlightSquares: Challenge['highlightSquares'] = () => {
    return this.goodSquares.map((coord) => ({ coord, color: 'lightYellow' }))
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move }) => {
    // Unclear from the video, but let's say promotion moves are allowed
    return getAllMovers(board, move).every(
      (mover) => isPawn(mover.pieceBefore) || this.goodSquares.some((c) => c.equals(mover.to))
    )
  }
}

export class Challenge_2022_09_19 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '52620ef2-a11c-4b1c-bb40-652a482ba724',
    title: 'The Entire Game Were BLUNDERS !!!',
    link: 'https://www.youtube.com/watch?v=TRkyi_i6EqY',
    challenge:
      'Chess, but your pawns are plotting against you, you need to get rid of them before making any captures.',
    records: new Map([
      [users.Mendax.name, { when: new Date('2023-07-06'), depth: 1, moves: 33 }],
      [users.fextivity.name, { when: new Date('2023-08-10'), depth: 2, moves: 22 }],
    ]),
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move }) => {
    const capture = getCapture(move)
    const noPawnsLeft = board.pieces().every(({ piece }) => piece !== Piece.WhitePawn)
    return capture ? noPawnsLeft : true
  }
}
