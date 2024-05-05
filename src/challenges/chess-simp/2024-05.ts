import { Challenge } from '@/challenges/core'
import { users } from '@/challenges/users'
import { getAllMovers, getMovePiece } from '@/move'
import { PieceEmpty, isPawn } from '@/piece'
import { Coord } from '@/utils/coord'
import { P, match } from 'ts-pattern'

export class Simp_2024_05_01 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: 'b8add891-a281-4569-9875-b6cce63f9338',
    title: 'This Is Why Chess Pieces Can Fly',
    link: 'https://www.youtube.com/watch?v=ZM_8zFV9th8',
    challenge:
      "Chess, but it's a platformer. Your pieces (not pawns) must always land directly above another piece/pawn.",
    records: new Map([]),
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move }) => {
    // For all pieces that moved: if the piece is not a pawn, check that the piece landed above a non-empty square.
    return getAllMovers(board, move).every(
      ({ pieceBefore, from, to }) =>
        // Pawns are always ok (this also handles the very tricky case of en passant where idk what the right answer is otherwise)
        isPawn(pieceBefore) ||
        // For pieces, we can check the square in the board before the move, *but* pieces can never move north
        (!to.s().equals(from) && board.at(to.s()) !== PieceEmpty)
    )
  }
}
