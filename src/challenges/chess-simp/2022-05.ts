import { Board } from '@/board'
import { Challenge } from '@/challenges/core'
import { users } from '@/challenges/users'
import { Move, getAllMovers, getCapture, getMoveCoords } from '@/move'
import { Color, isBlackPiece, isKing } from '@/piece'
import { Coord } from '@/utils/coord'
import _ from 'lodash'
import { P, match } from 'ts-pattern'

export class Simp_2022_05_24 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: 'f2941f89-4412-448f-94f5-25f7c46dc29b',
    title: 'Slow And Steady',
    link: 'https://www.youtube.com/watch?v=VwH-Gqzfpos',
    challenge: 'Chess, but you can only move pieces (and pawns) one square at a time.',
    records: new Map([
      [users.Emily.name, { when: new Date('2023-06-23'), depth: 3 }],
      [users.fextivity.name, { when: new Date('2023-08-21'), depth: 2, moves: 62 }],
      [users.Mendax.name, { when: new Date('2023-08-26'), depth: 2, moves: 70 }],
      [users.Arnout.name, { when: new Date('2023-08-31'), depth: 1, moves: 39 }],
    ]),
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ move }) => {
    return match(move)
      .with({ kind: P.union('normal', 'enPassant') }, ({ from, to }) => from.kingDistance(to) === 1)
      .with({ kind: 'castling' }, () => false)
      .exhaustive()
  }
}

export class Simp_2022_05_30 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '8491849c-db4c-4013-a21b-01b0e9203880',
    title: 'He Offered A Draw...',
    link: 'https://www.youtube.com/watch?v=kfxg5wGLVBw',
    challenge: '100 rated chess but you can only take their most extended piece or pawn.',
    records: new Map([
      [users.Mendax.name, { when: new Date('2023-07-05'), depth: 4 }],
      [users.fextivity.name, { when: new Date('2023-08-16'), depth: 2, moves: 44 }],
      [users.Emily.name, { when: new Date('2023-08-18'), depth: 1, moves: 25 }],
      [users.Arnout.name, { when: new Date('2023-08-31'), depth: 1, moves: 53 }],
    ]),
  }

  private mostExtendedRow = (board: Board) => {
    const blackPieces = board.pieces().filter(({ piece }) => isBlackPiece(piece))
    return _.min(blackPieces.map(({ coord }) => coord.y))!
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move }) => {
    // If there are several pieces that are equally extended, you can take any of them (1:19 in the video). If you're not taking a piece, you can do whatever you want.
    const mostExtendedRow = this.mostExtendedRow(board)
    return match(move)
      .with({ kind: 'normal' }, ({ to }) => board.isEmpty(to) || to.y === mostExtendedRow)
      .with({ kind: 'enPassant' }, ({ captureCoord }) => captureCoord.y === mostExtendedRow)
      .with({ kind: 'castling' }, () => true)
      .exhaustive()
  }

  highlightSquares: NonNullable<Challenge['highlightSquares']> = ({ board }) => {
    const mostExtendedRow = this.mostExtendedRow(board)
    return Board.allSquares()
      .filter((square) => isBlackPiece(board.at(square)) && square.y === mostExtendedRow)
      .map((coord) => ({ color: 'blue', coord }))
  }
}

export class Simp_2022_05_31 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '39efe131-5fb0-4294-b832-1d4d31a89f84',
    title: 'What If He Only Moves His King ??',
    link: 'https://www.youtube.com/watch?v=KDPXaL9V7hY',
    challenge: 'Chess, but the only piece you can take is the piece your opponent had just moved.',
    records: new Map([
      [users.RotomAppliance.name, { when: new Date('2023-07-07'), depth: 3, moves: 25 }],
      [users.Mendax.name, { when: new Date('2023-07-08'), depth: 4, moves: 44 }],
      [users.fextivity.name, { when: new Date('2023-08-16'), depth: 2, moves: 19 }],
      [users.Emily.name, { when: new Date('2023-08-18'), depth: 1, moves: 13 }],
      [users.Arnout.name, { when: new Date('2023-08-31'), depth: 1, moves: 11 }],
    ]),
  }

  private allowedVictims = (history: { move: Move; boardBeforeMove: Board }[]) => {
    const lastMove = _.last(history)
    if (!lastMove) return null
    // Note: kings can't ever be captured so we take care not to return them
    return match(lastMove.move)
      .with({ kind: P.union('normal', 'enPassant') }, ({ from, to }) =>
        isKing(lastMove.boardBeforeMove.at(from)) ? [] : [to]
      )
      .with({ kind: 'castling' }, ({ rookTo }) => [rookTo])
      .exhaustive()
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ history, board, move }) => {
    const allowedVictims = this.allowedVictims(history)
    if (!allowedVictims) return true
    const capture = getCapture(move)
    if (!capture) return true
    return allowedVictims.some((victim) => victim.equals(capture.victim))
  }

  highlightSquares: NonNullable<Challenge['highlightSquares']> = ({ history, board }) => {
    const allowedVictims = this.allowedVictims(history)
    if (!allowedVictims || board.side === Color.Black) return []
    return allowedVictims.map((victim) => ({ coord: victim, color: 'blue' }))
  }
}

export class Simp_2022_05_12 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: 'b1583d71-56eb-4a4f-871a-7ae6ca041ca8',
    title: 'This Is Not Cheating',
    link: 'https://www.youtube.com/watch?v=noAFs6XVS74',
    challenge:
      'Chess, but you have tunnel vision. You can only move the pieces (or pawns) that are CURRENTLY within a 3-tile range from what your opponent just moved.',
    records: new Map([
      [users.Mendax.name, { when: new Date('2023-07-08'), depth: 2, moves: 31 }],
      [users.Arnout.name, { when: new Date('2023-08-31'), depth: 1, moves: 13 }],
    ]),
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move, history }) => {
    const lastMove = _.last(history)
    if (!lastMove) return true
    const justMoved: Coord = getMoveCoords(lastMove.move).to
    return getAllMovers(board, move).every((mover) => mover.from.kingDistance(justMoved) <= 3)
  }

  highlightSquares: NonNullable<Challenge['highlightSquares']> = ({ history }) => {
    const lastBlackMove = _.findLast(history, (x) => x.boardBeforeMove.side === Color.Black)
    if (!lastBlackMove) return []
    const justMoved: Coord = getMoveCoords(lastBlackMove.move).to
    return Board.allSquares()
      .filter((square) => square.kingDistance(justMoved) <= 3)
      .map((square) => ({ coord: square, color: 'lightYellow' }))
  }
}

export class Simp_2022_05_17 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '38c6d49d-4517-4ca9-bee4-e9ccca5f68fe',
    title: 'A Check Will Ruin Everything',
    link: 'https://www.youtube.com/watch?v=3hXbiil9k5g',
    challenge:
      'Chess, but you must commit to a file for 2 turns. Only pieces and pawns that are currently inside that file can be moved.',
    records: new Map([
      [users.fextivity.name, { when: new Date('2023-08-18'), depth: 1, moves: 25 }],
      [users.Mendax.name, { when: new Date('2023-08-25'), depth: 2, moves: 16 }],
      [users.Arnout.name, { when: new Date('2023-08-31'), depth: 1, moves: 23 }],
    ]),
  }

  private committedFile: number | null = null

  highlightSquares: Challenge['highlightSquares'] = ({ board }) => {
    return this.committedFile === null
      ? []
      : Array.from({ length: 8 }, (_, i) => ({
          coord: new Coord(this.committedFile!, i),
          color: 'lightYellow',
        }))
  }

  recordMove: Challenge['recordMove'] = ({ side, move }) => {
    if (side === Color.White) {
      if (this.committedFile === null) {
        const from = getMoveCoords(move).from
        this.committedFile = from.x
      } else {
        this.committedFile = null
      }
    }
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move }) => {
    if (move.kind === 'castling') return false // never allowed!
    if (this.committedFile === null) return true
    return getAllMovers(board, move).every((mover) => mover.from.x === this.committedFile)
  }
}
