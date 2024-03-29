import { Board } from '@/board'
import { MaybePiece, MaybePieceType, Color, makePiece, Piece, PieceType, PieceEmpty } from '@/piece'
import { Coord } from '@/utils/coord'

/**
 * Determine if a king would be attacked by pieces of a certain color, if the king was standing on that square.
 *
 * NB: A square is not considered to be attacked by a piece standing on that square.
 */
export function isKingAttackedByColor(board: Board, enemy: Color, target: Coord) {
  // We could do a check for all pieces of the opposite color, and we actually did it, and it was slow. Instead we'll go in 8 directions + 8 knight moves, and check if we stumble upon a piece of the opposite color.

  const enemyKnight = makePiece(enemy, PieceType.Knight)
  const enemyBishop = makePiece(enemy, PieceType.Bishop)
  const enemyRook = makePiece(enemy, PieceType.Rook)
  const enemyQueen = makePiece(enemy, PieceType.Queen)
  const enemyKing = makePiece(enemy, PieceType.King)

  // Step 1: check if there's a pawn that can attack the target square. We don't count en passant because a king can't be attacked by en passant.
  if (enemy === Color.Black) {
    if (board.at(target.nw()) === Piece.BlackPawn) return true
    if (board.at(target.ne()) === Piece.BlackPawn) return true
  } else {
    if (board.at(target.sw()) === Piece.WhitePawn) return true
    if (board.at(target.se()) === Piece.WhitePawn) return true
  }

  // Step 2: check if there's a knight that can attack the target square.
  for (const c of target.knightNeighbors()) {
    if (board.at(c) === enemyKnight) return true
  }

  // Step 3: check if there's a rook or queen that can attack the target square.
  for (let xy = target.n(); xy.isValid(); xy = xy.n()) {
    const piece = board.unsafeAt(xy)
    if (piece === enemyRook || piece === enemyQueen) return true
    if (piece !== PieceEmpty) break
  }
  for (let xy = target.s(); xy.isValid(); xy = xy.s()) {
    const piece = board.unsafeAt(xy)
    if (piece === enemyRook || piece === enemyQueen) return true
    if (piece !== PieceEmpty) break
  }
  for (let xy = target.e(); xy.isValid(); xy = xy.e()) {
    const piece = board.unsafeAt(xy)
    if (piece === enemyRook || piece === enemyQueen) return true
    if (piece !== PieceEmpty) break
  }
  for (let xy = target.w(); xy.isValid(); xy = xy.w()) {
    const piece = board.unsafeAt(xy)
    if (piece === enemyRook || piece === enemyQueen) return true
    if (piece !== PieceEmpty) break
  }

  // Step 4: check if there's a bishop or queen that can attack the target square.
  for (let xy = target.ne(); xy.isValid(); xy = xy.ne()) {
    const piece = board.unsafeAt(xy)
    if (piece === enemyQueen || piece === enemyBishop) return true
    if (piece !== PieceEmpty) break
  }
  for (let xy = target.nw(); xy.isValid(); xy = xy.nw()) {
    const piece = board.unsafeAt(xy)
    if (piece === enemyQueen || piece === enemyBishop) return true
    if (piece !== PieceEmpty) break
  }
  for (let xy = target.se(); xy.isValid(); xy = xy.se()) {
    const piece = board.unsafeAt(xy)
    if (piece === enemyQueen || piece === enemyBishop) return true
    if (piece !== PieceEmpty) break
  }
  for (let xy = target.sw(); xy.isValid(); xy = xy.sw()) {
    const piece = board.unsafeAt(xy)
    if (piece === enemyQueen || piece === enemyBishop) return true
    if (piece !== PieceEmpty) break
  }

  // Step 5: check if there's a king that can attack the target square.
  for (const c of target.kingNeighbors()) {
    if (board.at(c) === enemyKing) return true
  }

  return false
}
