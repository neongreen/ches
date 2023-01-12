// TODO: en passant

import { Board } from '@/board'
import { pieceColor, Piece, PieceType, pieceType, Color } from '@/piece'
import { Coord } from '@/utils/coord'
import _ from 'lodash'

/**
 * Determine if a square is attacked by pieces of a certain color.
 *
 * NB: A square is not considered to be attacked by a piece standing on that square.
 */
export function isAttackedByColor(board: Board, color: Color, target: Coord) {
  // For all pieces on the board, let's see if they can move to the target square.
  const isAttackedBy = (coord: Coord) => {
    if (_.isEqual(coord, target)) return false
    const piece = board.at(coord)
    if (piece === Piece.Empty) return false
    if (pieceColor(piece) !== color) return false
    switch (pieceType(piece)) {
      case PieceType.Pawn:
        return isAttackedByPawn(board, coord, target)
      case PieceType.Knight:
        return isAttackedByKnight(board, coord, target)
      case PieceType.Bishop:
        return isAttackedByBishop(board, coord, target)
      case PieceType.Rook:
        return isAttackedByRook(board, coord, target)
      case PieceType.Queen:
        return isAttackedByQueen(board, coord, target)
      case PieceType.King:
        return isAttackedByKing(board, coord, target)
    }
  }
  for (let pieceX = 0; pieceX < 8; pieceX++)
    for (let pieceY = 0; pieceY < 8; pieceY++)
      if (isAttackedBy(new Coord(pieceX, pieceY))) return true
  return false
}

export function isAttackedByRook(board: Board, rook: Coord, target: Coord) {
  if (rook.x === target.x) {
    const [min, max] = [Math.min(rook.y, target.y), Math.max(rook.y, target.y)]
    for (let y = min + 1; y < max; y++) {
      if (board.isOccupied(new Coord(target.x, y))) return false
    }
    return true
  } else if (rook.y === target.y) {
    const [min, max] = [Math.min(rook.x, target.x), Math.max(rook.x, target.x)]
    for (let x = min + 1; x < max; x++) {
      if (board.isOccupied(new Coord(x, target.y))) return false
    }
    return true
  } else {
    return false
  }
}

function isAttackedByBishop(board: Board, bishop: Coord, target: Coord) {
  // TODO: this fails if bishop === target
  if (bishop.x + bishop.y === target.x + target.y) {
    const delta = bishop.x < target.x ? 1 : -1
    let x = bishop.x + delta
    let y = bishop.y - delta
    while (x !== target.x) {
      if (board.isOccupied(new Coord(x, y))) return false
      x += delta
      y -= delta
    }
    return true
  } else if (bishop.x - bishop.y === target.x - target.y) {
    const delta = bishop.x < target.x ? 1 : -1
    let x = bishop.x + delta
    let y = bishop.y + delta
    while (x !== target.x) {
      if (board.isOccupied(new Coord(x, y))) return false
      x += delta
      y += delta
    }
    return true
  } else {
    return false
  }
}

function isAttackedByQueen(board: Board, queen: Coord, target: Coord) {
  return isAttackedByRook(board, queen, target) || isAttackedByBishop(board, queen, target)
}

function isAttackedByKnight(board: Board, knight: Coord, target: Coord) {
  const xd = Math.abs(knight.x - target.x)
  const yd = Math.abs(knight.y - target.y)
  return (xd === 1 && yd === 2) || (xd === 2 && yd === 1)
}

function isAttackedByKing(board: Board, king: Coord, target: Coord) {
  const xd = Math.abs(king.x - target.x)
  const yd = Math.abs(king.y - target.y)
  return xd <= 1 && yd <= 1
}

function isAttackedByPawn(board: Board, pawn: Coord, target: Coord) {
  if (pieceColor(board.at(pawn)) === Color.White) {
    return target.y === pawn.y + 1 && Math.abs(target.x - pawn.x) === 1
  } else {
    return target.y === pawn.y - 1 && Math.abs(target.x - pawn.x) === 1
  }
}
