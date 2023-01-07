/** @typedef {number} Piece */
/** @typedef {0x10 | 0x20} Color */

const EMPTY = 0x00
const WHITE = 0x10
const BLACK = 0x20

const WHITE_PAWN = 0x01 | WHITE
const WHITE_KNIGHT = 0x02 | WHITE
const WHITE_BISHOP = 0x03 | WHITE
const WHITE_ROOK = 0x04 | WHITE
const WHITE_QUEEN = 0x05 | WHITE
const WHITE_KING = 0x06 | WHITE

const BLACK_PAWN = 0x01 | BLACK
const BLACK_KNIGHT = 0x02 | BLACK
const BLACK_BISHOP = 0x03 | BLACK
const BLACK_ROOK = 0x04 | BLACK
const BLACK_QUEEN = 0x05 | BLACK
const BLACK_KING = 0x06 | BLACK

const isPawn = (piece) => piece === WHITE_PAWN || piece === BLACK_PAWN
const isKnight = (piece) => piece === WHITE_KNIGHT || piece === BLACK_KNIGHT
const isBishop = (piece) => piece === WHITE_BISHOP || piece === BLACK_BISHOP
const isRook = (piece) => piece === WHITE_ROOK || piece === BLACK_ROOK
const isQueen = (piece) => piece === WHITE_QUEEN || piece === BLACK_QUEEN
const isKing = (piece) => piece === WHITE_KING || piece === BLACK_KING

const color = (piece) => piece & 0xf0
const isWhite = (piece) => color(piece) === WHITE
const isBlack = (piece) => color(piece) === BLACK

const letterToPiece = (letter) => {
  switch (letter) {
    case 'P':
      return WHITE_PAWN
    case 'N':
      return WHITE_KNIGHT
    case 'B':
      return WHITE_BISHOP
    case 'R':
      return WHITE_ROOK
    case 'Q':
      return WHITE_QUEEN
    case 'K':
      return WHITE_KING
    case 'p':
      return BLACK_PAWN
    case 'n':
      return BLACK_KNIGHT
    case 'b':
      return BLACK_BISHOP
    case 'r':
      return BLACK_ROOK
    case 'q':
      return BLACK_QUEEN
    case 'k':
      return BLACK_KING
    default:
      return EMPTY
  }
}
