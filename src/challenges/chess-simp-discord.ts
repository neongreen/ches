import { getMovePiece, getCapture, isCapture, Move, moveIsEqual, getMoveCoord } from '@/move'
import { legalMovesForPiece_slow, legalMoves_slow } from '@/move/legal'
import { isBlack, isKing, isPawn, pieceType } from '@/piece'
import { Coord } from '@/utils/coord'
import _ from 'lodash'
import { match } from 'ts-pattern'
import { Challenge } from './core'

const challenge_mustKeepMoving: Challenge = {
  uuid: '5f747bf3-6819-482f-86bb-c82b181b8ac3',
  title: '[breadfeller] Must Keep Moving',
  link: 'https://discord.com/channels/866701779155419206/884667730891010048/1122552015080403145',
  challenge:
    'Once you move a piece (or pawn), you must keep moving that piece (or pawn) until they can no longer move anymore or is captured.',
  isMoveAllowed({ history, move, board }): boolean {
    // Instead of keeping state, we just look at our last move. If the moved piece doesn't exist anymore or there are no legal moves for that piece, we allow all moves. NB: castling counts as a king move.
    const ourLastMove = history.at(-2)
    if (!ourLastMove) return true
    // Find the piece that moved last.
    const pieceThatMovedLast: Coord = getMoveCoord(ourLastMove.move).to
    // If we're moving the piece that moved last, it's good.
    if (getMoveCoord(move).from.equals(pieceThatMovedLast)) return true
    // If the moved piece doesn't exist anymore, we allow all moves.
    if (board.isEmpty(pieceThatMovedLast)) return true
    // If there are no legal moves for that piece, we allow all moves.
    if (legalMovesForPiece_slow(board, pieceThatMovedLast).length === 0) return true
    // Otherwise - no, sorry.
    return false
  },
}

/**
 * Challenges from the #video-suggestion channel on the Chess Simp Discord: https://discord.com/channels/866701779155419206/884667730891010048
 */
export const chessSimpDiscordChallenges: Challenge[] = [challenge_mustKeepMoving]
