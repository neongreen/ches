import { Board } from '@/board'
import { Challenge } from '@/challenges/core'
import { users } from '@/challenges/users'
import { getAllMovers } from '@/move'
import { quasiLegalMovesFrom } from '@/move/quasi-legal'
import { getMoveCoords } from '@/move'
import { isKingAttackedByColor } from '@/move/attacked'
import {
  Color,
  PieceEmpty,
  isBishop,
  isQueen,
  isRook,
  pieceColor,
} from '@/piece'
import { Coord } from '@/utils/coord'

function isSlidingPiece(piece: number) {
  return isBishop(piece) || isRook(piece) || isQueen(piece)
}

function isSquareDefended(board: Board, coord: Coord): boolean {
  const piece = board.at(coord)
  const color = pieceColor(piece) as Color
  return isKingAttackedByColor(board, color, coord)
}

function attackedSquares(board: Board, coord: Coord): Coord[] {
  const piece = board.at(coord)
  return quasiLegalMovesFrom(board, piece, coord).map((m) => getMoveCoords(m).to)
}

export class Simp_2024_06_01 implements Challenge {
  meta: Challenge['meta'] = {
    uuid: '1125729e-6657-4864-a050-9df064687a91',
    title: 'Baby Mode',
    link: null,
    challenge: 'You are not allowed to fork or pin an undefended piece or pawn.',
    records: new Map([
      [users.Mendax.name, { when: new Date('2024-09-01'), depth: 0 }],
    ]),
  }

  isMoveAllowed: Challenge['isMoveAllowed'] = ({ board, move }) => {
    if (board.side !== Color.White) return true

    const boardAfter = board.clone()
    boardAfter.executeMove(move)

    for (const { to } of getAllMovers(board, move)) {
      const piece = boardAfter.at(to)
      if (pieceColor(piece) !== Color.White) continue

      const squares = attackedSquares(boardAfter, to)
      const enemyTargets = squares.filter(
        (c) => pieceColor(boardAfter.at(c)) === Color.Black
      )
      if (enemyTargets.length < 2) continue

      for (const target of enemyTargets) {
        if (!isSquareDefended(boardAfter, target)) {
          return false
        }
      }

      if (isSlidingPiece(piece)) {
        for (const target of enemyTargets) {
          if (!isSquareDefended(boardAfter, target)) {
            const delta = {
              x: Math.sign(target.x - to.x),
              y: Math.sign(target.y - to.y),
            }
            let c = target.shift(delta)
            while (c.isValid()) {
              const occup = boardAfter.at(c)
              if (occup !== PieceEmpty) {
                if (pieceColor(occup) === Color.Black) {
                  return false
                }
                break
              }
              c = c.shift(delta)
            }
          }
        }
      }
    }

    return true
  }
}

