import { Board } from '@/board'
import { getCapture, getMoveCoords, getMovePiece } from '@/move'
import { legalMovesForPiece_slow } from '@/move/legal'
import { Color, isBlackPiece, isPawn, isWhitePiece } from '@/piece'
import { Coord } from '@/utils/coord'
import { Uuid } from '@/utils/uuid'
import _ from 'lodash'
import { P, match } from 'ts-pattern'
import { Challenge, ChallengeMeta } from './core'
import { users } from './users'

class SimpDiscord_MustKeepMoving implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '5f747bf3-6819-482f-86bb-c82b181b8ac3',
    title: '[breadfeller] Must Keep Moving',
    link: 'https://discord.com/channels/866701779155419206/884667730891010048/1122552015080403145',
    challenge:
      'Once you move a piece (or pawn), you must keep moving that piece (or pawn) until they can no longer move anymore or is captured.',
    records: new Map([
      [users.Mendax.name, { when: new Date('2023-07-03'), depth: 1 }],
      [users.Arnout.name, { when: new Date('2023-08-31'), depth: 1, moves: 39 }],
    ]),
  }

  private chosenPiece: Coord | null = null

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ move, board }) => {
    if (!this.chosenPiece) return true
    if (getMoveCoords(move).from.equals(this.chosenPiece)) return true
    if (legalMovesForPiece_slow(board, this.chosenPiece).length === 0) return true
    return false
  }

  recordMove: NonNullable<Challenge['recordMove']> = ({ move, side, boardAfterMove }) => {
    if (side === Color.White) {
      // If we're moving a piece, we'll record it as the piece we're locking into.
      this.chosenPiece = getMoveCoords(move).to
    } else {
      // If the opponent captured our chosen piece, all pieces are unlocked.
      if (this.chosenPiece !== null && isBlackPiece(boardAfterMove.at(this.chosenPiece))) {
        this.chosenPiece = null
      }
    }
  }

  highlightSquares: NonNullable<Challenge['highlightSquares']> = () => {
    if (this.chosenPiece) return [{ color: 'blue', coord: this.chosenPiece }]
    else return []
  }
}

const simpDiscord_pawnObsession: Challenge = {
  meta: {
    uuid: 'c80df7ae-47c4-43a7-ac0f-7c0da4d206cc',
    title: '[Alexey53] Emil Josef Diemer Wannabe',
    link: 'https://discord.com/channels/866701779155419206/884667730891010048/1085457075448057916',
    challenge: 'Your first 17 moves of the game must be consecutive pawn moves.',
    records: new Map([
      [users.RotomAppliance.name, { when: new Date('2023-07-06'), depth: 3, moves: 42 }],
      [users.Mendax.name, { when: new Date('2023-07-06'), depth: 4, moves: 35 }],
      [users.Arnout.name, { when: new Date('2023-08-31'), depth: 1, moves: 34 }],
    ]),
  },
  isMoveAllowed({ currentFullMoveNumber, move, board }): boolean {
    const isPawnMove = isPawn(getMovePiece(board, move))
    return isPawnMove || currentFullMoveNumber > 17
  },
}

const simpDiscord_twoMovesMax: Challenge = {
  meta: {
    uuid: 'bd58184f-990e-4cc3-9c73-5fb28cc9f95b',
    title: "[Cheftic] You're Short",
    link: 'https://discord.com/channels/866701779155419206/884667730891010048/1122275013119180840',
    challenge:
      "Chess, but you're short. You cannot make any long distance moves (2 squares max, like the king goes). Short castling is allowed.",
    records: new Map([
      [users.Mendax.name, { when: new Date('2023-07-05'), depth: 4 }],
      [users.fextivity.name, { when: new Date('2023-08-23'), depth: 3, moves: 57 }],
    ]),
  },
  isMoveAllowed({ move }): boolean {
    return match(move)
      .with({ kind: P.union('normal', 'enPassant') }, ({ from, to }) => {
        const distance = from.kingDistance(to)
        return distance !== null && distance <= 2
      })
      .with({ kind: 'castling' }, ({ kingFrom, kingTo, rookFrom, rookTo }) => {
        const kingDistance = kingFrom.kingDistance(kingTo)
        const rookDistance = rookFrom.kingDistance(rookTo)
        return (
          kingDistance !== null && kingDistance <= 2 && rookDistance !== null && rookDistance <= 2
        )
      })
      .exhaustive()
  },
}

class SimpDiscord_Vampires implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '988d559d-5ad5-4f7e-9574-247c6e2aee2b',
    title: '[pinon_] Vampires',
    link: 'https://discord.com/channels/866701779155419206/884667730891010048/1122440838719479808',
    challenge:
      'Chess, but all of your pieces (and pawns) are vampires. Anytime one of your pieces (or pawns) has a direct line of sight past your opponent’s edge of the board, they are hit by sunlight and turn to ash.',
    records: new Map([
      [users.Mendax.name, { when: new Date('2023-07-06'), depth: 3 }],
      [users.fextivity.name, { when: new Date('2023-08-19'), depth: 2, moves: 7 }],
      [users.Emily.name, { when: new Date('2023-08-19'), depth: 2, moves: 6 }],
    ]),
  }

  private burnedPieces: Coord[] = []
  private isBurned(coord: Coord): boolean {
    return this.burnedPieces.some((c) => c.equals(coord))
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ move }) => {
    return match(move)
      .with({ kind: P.union('normal', 'enPassant') }, ({ from }) => !this.isBurned(from))
      .with(
        { kind: 'castling' },
        ({ kingFrom, rookFrom }) => !this.isBurned(kingFrom) && !this.isBurned(rookFrom)
      )
      .exhaustive()
  }

  recordMove: NonNullable<Challenge['recordMove']> = ({ move, boardAfterMove }) => {
    // Remove all nonexistent pieces from `burnedPieces`.
    this.burnedPieces = this.burnedPieces.filter((coord) => isWhitePiece(boardAfterMove.at(coord)))
    // For all our pieces, check if maybe they are burned now.
    for (const coord of Board.allSquares()) {
      const piece = boardAfterMove.at(coord)
      if (isWhitePiece(piece) && !this.isBurned(coord)) {
        const squares = coord.pathTo(new Coord(coord.x, Board.dimensions.height), 'exclusive')
        // NB: we can't just pass isEmpty without a lambda, because it would be called with the wrong `this`. Sad times. Maybe TypeScript isn't *that* good after all.
        // See https://github.com/Microsoft/TypeScript/wiki/FAQ#why-does-this-get-orphaned-in-my-instance-methods
        const isBurned = squares.every((x) => boardAfterMove.isEmpty(x))
        if (isBurned) this.burnedPieces.push(coord)
      }
    }
  }

  highlightSquares: NonNullable<Challenge['highlightSquares']> = () => {
    return this.burnedPieces.map((coord) => ({ coord, color: 'red' }))
  }
}

class SimpDiscord_Alphabetical implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '900c4b64-0795-44ae-a272-1dbb8b218a55',
    title: '[nakkisalsa] Alphabetical',
    challenge:
      'Chess, but you must move in alphabetical file order (move a piece on A file, then B file and so forth, looping back around after H). Castling is a king move.',
    link: 'https://discord.com/channels/866701779155419206/884667730891010048/1146177472073830563',
    records: new Map([
      [users.Mendax.name, { when: new Date('2023-09-01'), depth: 2, moves: 12 }],
      [users.Arnout.name, { when: new Date('2023-09-01'), depth: 2, moves: 12 }],
    ]),
  }

  private allowedFile = 0

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ move }) => {
    return getMoveCoords(move).from.x === this.allowedFile
  }

  highlightSquares: NonNullable<Challenge['highlightSquares']> = () => {
    return Coord.squaresInColumn(this.allowedFile).map((coord) => ({
      coord,
      color: 'lightYellow',
    }))
  }

  recordMove: NonNullable<Challenge['recordMove']> = ({ side }) => {
    // We want to shift allowedFile only after the opponent has moved. Feels nicer.
    if (side === Color.Black) {
      this.allowedFile = (this.allowedFile + 1) % Board.dimensions.width
    }
  }
}

class SimpDiscord_UnendingCycleOfRevenge implements Challenge {
  meta: Challenge['meta'] = {
    uuid: 'd437f726-11f3-4bc4-82ba-3f792a64221b',
    title: '[museofsalzburg] The Unending Cycle of Revenge',
    link: 'https://discord.com/channels/866701779155419206/884667730891010048/1148964785791176704',
    challenge:
      "Chess, but it's the unending cycle of revenge. Whenever a piece or pawn is captured, the capturer must be the next piece captured.",
    records: new Map([
      [users.Mendax.name, { when: new Date('2023-09-13'), depth: 2, moves: 8 }],
      [users.Emily.name, { when: new Date('2023-09-15'), depth: 2, moves: 6 }],
    ]),
  }

  // Ids of all capturing pieces in the order they did captures.
  private allCapturers: number[] = []
  // Ids of all captured pieces in the order they were captured.
  private allVictims: number[] = []

  recordMove: NonNullable<Challenge['recordMove']> = ({ history }) => {
    const lastMove = _.last(history)!
    const capture = getCapture(lastMove.move)
    if (capture) {
      this.allCapturers.push(lastMove.beforeMove.identity.getByCoord(capture.attacker)!.id)
      this.allVictims.push(lastMove.beforeMove.identity.getByCoord(capture.victim)!.id)
    }
  }

  highlightSquares: NonNullable<Challenge['highlightSquares']> = ({ identity }) => {
    // Highlight the last capturer's position
    const lastCapturer = _.last(this.allCapturers)
    if (lastCapturer === undefined) return []
    return [
      {
        coord: identity.getById(lastCapturer)!.coord,
        color: 'lightYellow',
      },
    ]
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ move, identity }) => {
    // You are only allowed to capture the last capturer, unless there were no captures before.
    const lastCapturerId = _.last(this.allCapturers)
    if (lastCapturerId === undefined) return true
    const capture = getCapture(move)
    if (!capture) return true
    return lastCapturerId === identity.getByCoord(capture.victim)!.id
  }

  isChallengeLost: NonNullable<Challenge['isChallengeLost']> = ({ history }) => {
    // The last victim must always be the second-to-last capturer, unless there is only one victim
    const lastVictimId = this.allVictims[this.allVictims.length - 1]
    const secondToLastCapturerId = this.allCapturers[this.allCapturers.length - 2]
    if (lastVictimId === undefined) return { lost: false }
    if (this.allVictims.length === 1) return { lost: false }
    return { lost: lastVictimId !== secondToLastCapturerId }
  }
}

/**
 * Challenges from the #video-suggestion channel on the Chess Simp Discord: https://discord.com/channels/866701779155419206/884667730891010048
 */
export const chessSimpDiscordChallenges: Map<
  Uuid,
  { meta: ChallengeMeta; create: () => Challenge }
> = new Map(
  [
    () => new SimpDiscord_MustKeepMoving(),
    () => simpDiscord_pawnObsession,
    () => simpDiscord_twoMovesMax,
    () => new SimpDiscord_Vampires(),
    () => new SimpDiscord_Alphabetical(),
    () => new SimpDiscord_UnendingCycleOfRevenge(),
  ].map((challengeFn) => [
    challengeFn().meta.uuid,
    { meta: challengeFn().meta, create: challengeFn },
  ])
)
