import { Board } from '@/board'
import { getMoveCoord, getMovePiece } from '@/move'
import { legalMovesForPiece_slow } from '@/move/legal'
import { Color, PieceEmpty, isBlackPiece, isPawn, isWhitePiece } from '@/piece'
import { Coord } from '@/utils/coord'
import { Uuid } from '@/utils/uuid'
import { P, match } from 'ts-pattern'
import { Challenge, ChallengeMeta } from './core'
import { users } from './users'

class Challenge_MustKeepMoving implements Challenge {
  meta = {
    uuid: '5f747bf3-6819-482f-86bb-c82b181b8ac3',
    title: '[breadfeller] Must Keep Moving',
    link: 'https://discord.com/channels/866701779155419206/884667730891010048/1122552015080403145',
    challenge:
      'Once you move a piece (or pawn), you must keep moving that piece (or pawn) until they can no longer move anymore or is captured.',
  }

  private chosenPiece: Coord | null = null

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ move, board }) => {
    if (!this.chosenPiece) return true
    if (getMoveCoord(move).from.equals(this.chosenPiece)) return true
    if (legalMovesForPiece_slow(board, this.chosenPiece).length === 0) return true
    return false
  }

  recordMove: NonNullable<Challenge['recordMove']> = ({
    move,
    boardBeforeMove,
    boardAfterMove,
  }) => {
    if (boardBeforeMove.side === Color.White) {
      // If we're moving a piece, we'll record it as the piece we're locking into.
      this.chosenPiece = getMoveCoord(move).to
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

const challenge_pawnObsession: Challenge = {
  meta: {
    uuid: 'c80df7ae-47c4-43a7-ac0f-7c0da4d206cc',
    title: '[Alexey53] Emil Josef Diemer Wannabe',
    link: 'https://discord.com/channels/866701779155419206/884667730891010048/1085457075448057916',
    challenge: 'Your first 17 moves of the game must be consecutive pawn moves.',
  },
  isMoveAllowed({ currentFullMoveNumber, move, board }): boolean {
    const isPawnMove = isPawn(getMovePiece(board, move))
    return isPawnMove || currentFullMoveNumber > 17
  },
}

const challenge_twoMovesMax: Challenge = {
  meta: {
    uuid: 'bd58184f-990e-4cc3-9c73-5fb28cc9f95b',
    title: "[Cheftic] You're Short",
    link: 'https://discord.com/channels/866701779155419206/884667730891010048/1122275013119180840',
    challenge:
      "Chess, but you're short. You cannot make any long distance moves (2 squares max, like the king goes). Short castling is allowed.",
    beaten: {
      name: users.Emily.name,
      depth: 3,
    },
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

class Challenge_Vampires implements Challenge {
  meta = {
    uuid: '988d559d-5ad5-4f7e-9574-247c6e2aee2b',
    title: '[pinon_] Vampires',
    link: 'https://discord.com/channels/866701779155419206/884667730891010048/1122440838719479808',
    challenge:
      'Chess, but all of your pieces (and pawns) are vampires. Anytime one of your pieces (or pawns) has a direct line of sight past your opponent’s edge of the board, they are hit by sunlight and turn to ash.',
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

/**
 * Challenges from the #video-suggestion channel on the Chess Simp Discord: https://discord.com/channels/866701779155419206/884667730891010048
 */
export const chessSimpDiscordChallenges: Map<
  Uuid,
  { meta: ChallengeMeta; create: () => Challenge }
> = new Map(
  [
    () => new Challenge_MustKeepMoving(),
    () => challenge_pawnObsession,
    () => challenge_twoMovesMax,
    () => new Challenge_Vampires(),
  ].map((challengeFn) => [
    challengeFn().meta.uuid,
    { meta: challengeFn().meta, create: challengeFn },
  ])
)
