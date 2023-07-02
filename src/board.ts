import { Color, isPawn, letterToPiece, Piece } from '@/piece'
import { Coord } from '@/utils/coord'
import { Move } from '@/move'
import { Zobrist, zobristCastling, zobristPiece, zobristWhiteToMove } from './zobrist'
import { Castling, CastlingBitmask } from './utils/castling'

/** Game state representation. Includes pieces, whose move it is, etc. */
export class Board {
  static dimensions = { width: 8, height: 8 }

  static allSquares = () => {
    const squares: Coord[] = []
    for (let x = 0; x < Board.dimensions.width; x++) {
      for (let y = 0; y < Board.dimensions.height; y++) {
        squares.push(new Coord(x, y))
      }
    }
    return squares
  }

  /**
   * The board as a 8x8 array.
   */
  board: Uint8Array

  /**
   * Whose move it is now.
   */
  side: Color

  /**
   * King locations, for faster check detection.
   */
  kings: { white: Coord; black: Coord }

  /**
   * Castling rights.
   */
  private castlingRights: CastlingBitmask

  /** Is there a castling right for X? */
  hasCastling(x: Castling): boolean {
    return Boolean(this.castlingRights & x)
  }

  /**
   * If the last move was a double pawn push, this is the "target square" for en passant captures - that is, the square behind the pawn that was pushed.
   */
  enPassantTargetSquare: Coord | null = null

  /**
   * The current position of the en passant pawn, if any.
   *
   * Invariant: `enPassantTarget === null` IFF `enPassantPawn() === null`.
   */
  enPassantTargetPawn(): Coord | null {
    if (this.enPassantTargetSquare === null) return null
    if (this.side === Color.White) {
      return this.enPassantTargetSquare.s()
    } else {
      return this.enPassantTargetSquare.n()
    }
  }

  /**
   * Previous positions' `state()`s. Used to detect three-fold repetition.
   *
   * This array is cleared after each irreversible move (pawn moves, captures, castling).
   */
  private previousPositions: string[] = []

  /**
   * Previous positions' hashes. This is kept in sync with `previousPositions`.
   */
  private previousPositionHashes: Zobrist[] = []

  /**
   * THREEFOLD REPETITION: `irreversibleMoveClock` is the number of half-moves since the last irreversible move (pawn moves, captures, castling). If it's 0, the last move was irreversible.
   *
   * Invariant: this is also the length of `previousPositions`.
   */
  irreversibleMoveClock = 0

  /**
   * FIFTY-MOVE RULE: `halfmoveClock` is the number of half-moves since the last capture or pawn move. If it's 0, the last move was a capture or pawn move.
   *
   * See https://www.chessprogramming.org/Halfmove_Clock
   */
  halfmoveClock = 0

  /**
   * Create a new board, or clone an existing one.
   *
   * By default, the board is set up in the standard chess starting position.
   */
  constructor(board?: Board) {
    if (board) {
      // Clone
      this.board = new Uint8Array(board.board)
      this.side = board.side
      this.kings = { ...board.kings }
      this.castlingRights = board.castlingRights
      this.enPassantTargetSquare = board.enPassantTargetSquare
      this.previousPositions = board.previousPositions.slice()
      this.previousPositionHashes = board.previousPositionHashes.slice()
      this.hash = board.hash
      this.irreversibleMoveClock = board.irreversibleMoveClock
      this.halfmoveClock = board.halfmoveClock
    } else {
      // We don't actually care about anything because `setFen` will overwrite everything, but things seem to be slower if we use {} etc.
      this.board = new Uint8Array(64)
      this.side = Color.White
      this.castlingRights = Castling.None
      this.kings = { white: new Coord(4, 0), black: new Coord(4, 7) }
      this.hash = 0
      this.setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    }
  }

  /**
   * Return a copy of the board.
   */
  clone() {
    return new Board(this)
  }

  /**
   * Return the position as a weird binary-ish string. We don't care about the contents of the string as long as the following invariant holds:
   *
   * if two strings are the same, the positions are the same with respect to the three-fold repetition rule.
   */
  state(): string {
    return String.fromCharCode(
      ...this.board,
      this.side,
      this.castlingRights,
      this.enPassantTargetSquare ? this.enPassantTargetSquare.x + 1 : 0,
      this.enPassantTargetSquare ? this.enPassantTargetSquare.y + 1 : 0
    )
  }

  /**
   * Stores a hash of the position.
   *
   * If two hashes are different, the positions are different with respect to the three-fold repetition rule. However, collisions are possible.
   */
  hash: Zobrist

  /**
   * Is the current position a three-fold repetition?
   *
   * FIXME: it's not 100% correct because currently it checks castling *rights*, but instead it should check if castling is *possible*. Otherwise it doesn't detect threefold repetition in the Magnus–Hikaru bongcloud game: https://lichess.org/study/yrzOym4t
   */
  isThreefoldRepetition(): boolean {
    // For a three-fold repetition, the position must have been repeated at least twice:
    //     A X A Y [A] <- current position
    // So there must be at least four positions in the array. (If there are three positions,
    // only one of them will be from the same side to move as the current side.)
    if (this.irreversibleMoveClock < 4) return false

    // We start searching from the end, because it's more likely that the repetition is recent.
    let count = 0
    const currentState = this.state()
    for (let i = this.previousPositionHashes.length - 1; i >= 0; i--) {
      if (
        this.previousPositionHashes[i] === this.hash &&
        this.previousPositions[i] === currentState
      )
        count++
      if (count >= 2) return true
    }
    return false
  }

  /**
   * Return the piece at coordinates (x, y).
   *
   * The bottom left corner is (0, 0) and the top right corner is (7, 7).
   *
   * If the coordinates are off the board, returns Piece.Empty.
   */
  at(coord: Coord): Piece {
    if (!coord.isValid()) return Piece.Empty
    return this.board[coord.y * 8 + coord.x]
  }

  /** Return the piece at coordinates (x, y).
   *
   * Doesn't check if the coordinates are off the board.
   */
  unsafeAt(coord: Coord): Piece {
    return this.board[coord.y * 8 + coord.x]
  }

  /**
   * Return all pieces and their coordinates.
   */
  pieces(): { coord: Coord; piece: Piece }[] {
    const pieces = []
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 8; x++) {
        const coord = new Coord(x, y)
        const piece = this.unsafeAt(coord)
        if (piece !== Piece.Empty) pieces.push({ coord, piece })
      }
    return pieces
  }

  /**
   * Set the piece at coordinates (x, y).
   *
   * Updates the hash and the kings position, but not the castling rights.
   *
   * @param pieceOld The piece that was previously at the given coordinates
   * @param pieceNew The piece to replace it with
   */
  private replace(coord: Coord, pieceOld: Piece, pieceNew: Piece) {
    this.hash ^= zobristPiece(pieceOld, coord) ^ zobristPiece(pieceNew, coord)
    this.board[coord.y * 8 + coord.x] = pieceNew
    if (pieceNew === Piece.WhiteKing) this.kings.white = coord
    if (pieceNew === Piece.BlackKing) this.kings.black = coord
  }

  /**
   * Is a square empty? NB: returns undefined if the square is off the board.
   */
  isEmpty(coord: Coord): boolean | undefined {
    if (!coord.isValid()) return undefined
    return this.unsafeAt(coord) === Piece.Empty
  }

  /**
   * Is a square occupied? NB: returns undefined if the square is off the board.
   */
  isOccupied(coord: Coord): boolean | undefined {
    if (!coord.isValid()) return undefined
    return this.unsafeAt(coord) !== Piece.Empty
  }

  /**
   * Set the board state, based on a FEN string.
   *
   * For example, the starting position is:
   *
   * ```
   * rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
   * ```
   */
  setFen(fen: string) {
    const [pieces, side, castling, enPassant, halfmove, fullmove] = fen.split(' ')

    this.hash = 0

    this.side = side === 'w' ? Color.White : Color.Black
    if (this.side === Color.White) this.hash ^= zobristWhiteToMove

    this.enPassantTargetSquare = enPassant === '-' ? null : Coord.fromAlgebraic(enPassant)

    this.castlingRights =
      (castling.includes('K') ? Castling.WhiteKingside : Castling.None) |
      (castling.includes('Q') ? Castling.WhiteQueenside : Castling.None) |
      (castling.includes('k') ? Castling.BlackKingside : Castling.None) |
      (castling.includes('q') ? Castling.BlackQueenside : Castling.None)
    this.hash ^= zobristCastling(this.castlingRights)

    this.halfmoveClock = parseInt(halfmove, 10)
    this.irreversibleMoveClock = 0
    this.previousPositions = []
    this.previousPositionHashes = []

    this.board = new Uint8Array(64).fill(Piece.Empty)
    let rows = pieces.split('/')
    rows.reverse()
    for (let y = 0; y < 8; y++) {
      let x = 0
      for (const char of rows[y]) {
        if (char >= '1' && char <= '8') {
          x += parseInt(char)
        } else {
          const piece = letterToPiece(char)
          const coord = new Coord(x, y)
          this.replace(coord, Piece.Empty, piece)
          x++
        }
      }
    }

    if (this.kings.white === undefined) throw new Error('White king not found')
    if (this.kings.black === undefined) throw new Error('Black king not found')
  }

  /**
   * Execute a move. Doesn't check if it's valid.
   */
  executeMove(move: Move) {
    const oldHash = this.hash
    const oldState = this.state()

    // We remember old castling rights so that later we can see if they have changed
    const oldCastlingRights = this.castlingRights

    // For the fifty-move rule
    let captureOrPawnMove = false

    switch (move.kind) {
      case 'normal':
        {
          const piece = this.at(move.from)
          const target = this.at(move.to)

          // We know we don't need the en passant target anymore, so we can remove it
          this.enPassantTargetSquare = null

          // If the king is moved, castling rights are lost
          if (piece === Piece.WhiteKing) {
            this.castlingRights &= ~Castling.WhiteAny
          } else if (piece === Piece.BlackKing) {
            this.castlingRights &= ~Castling.BlackAny
          }
          // Or if a rook is moved from its original position, castling rights are lost
          else if (piece === Piece.WhiteRook) {
            if (move.from.equals(new Coord(0, 0))) {
              this.castlingRights &= ~Castling.WhiteQueenside
            } else if (move.from.equals(new Coord(7, 0))) {
              this.castlingRights &= ~Castling.WhiteKingside
            }
          } else if (piece === Piece.BlackRook) {
            if (move.from.equals(new Coord(0, 7))) {
              this.castlingRights &= ~Castling.BlackQueenside
            } else if (move.from.equals(new Coord(7, 7))) {
              this.castlingRights &= ~Castling.BlackKingside
            }
          }

          // If a rook is captured, castling rights are also lost
          if (target === Piece.WhiteRook) {
            if (move.to.equals(new Coord(0, 0))) {
              this.castlingRights &= ~Castling.WhiteQueenside
            } else if (move.to.equals(new Coord(7, 0))) {
              this.castlingRights &= ~Castling.WhiteKingside
            }
          } else if (target === Piece.BlackRook) {
            if (move.to.equals(new Coord(0, 7))) {
              this.castlingRights &= ~Castling.BlackQueenside
            } else if (move.to.equals(new Coord(7, 7))) {
              this.castlingRights &= ~Castling.BlackKingside
            }
          }

          // If it was a double pawn push, set the en passant target
          if (piece === Piece.WhitePawn && move.from.n().n().equals(move.to)) {
            this.enPassantTargetSquare = move.from.n()
          } else if (piece === Piece.BlackPawn && move.from.s().s().equals(move.to)) {
            this.enPassantTargetSquare = move.from.s()
          }

          // Captures and pawn moves are irreversible and reset the halfmove clock
          if (target !== Piece.Empty || isPawn(piece)) captureOrPawnMove = true

          // Update the board
          this.replace(move.to, target, move.promotion ? move.promotion : piece)
          this.replace(move.from, piece, Piece.Empty)
        }
        break
      case 'castling':
        {
          this.enPassantTargetSquare = null

          if (this.side === Color.White) {
            // TODO: "move" instead of "replace"?
            this.replace(move.kingFrom, Piece.WhiteKing, Piece.Empty)
            this.replace(move.kingTo, Piece.Empty, Piece.WhiteKing)
            this.replace(move.rookFrom, Piece.WhiteRook, Piece.Empty)
            this.replace(move.rookTo, Piece.Empty, Piece.WhiteRook)
            this.castlingRights &= ~Castling.WhiteAny
          } else {
            this.replace(move.kingFrom, Piece.BlackKing, Piece.Empty)
            this.replace(move.kingTo, Piece.Empty, Piece.BlackKing)
            this.replace(move.rookFrom, Piece.BlackRook, Piece.Empty)
            this.replace(move.rookTo, Piece.Empty, Piece.BlackRook)
            this.castlingRights &= ~Castling.BlackAny
          }
        }
        break
      case 'enPassant':
        {
          const enPassantPawn = this.enPassantTargetPawn()
          if (enPassantPawn === null)
            throw new Error(
              'We are trying to execute an en passant move, but there is no en passant pawn'
            )
          this.enPassantTargetSquare = null
          if (this.side === Color.White) {
            this.replace(move.from, Piece.WhitePawn, Piece.Empty)
            this.replace(move.to, Piece.Empty, Piece.WhitePawn)
            this.replace(enPassantPawn, Piece.BlackPawn, Piece.Empty)
          } else {
            this.replace(move.from, Piece.BlackPawn, Piece.Empty)
            this.replace(move.to, Piece.Empty, Piece.BlackPawn)
            this.replace(enPassantPawn, Piece.WhitePawn, Piece.Empty)
          }
        }
        break
    }

    // If the castling rights have changed, update the hash
    if (oldCastlingRights !== this.castlingRights)
      this.hash ^= zobristCastling(oldCastlingRights) ^ zobristCastling(this.castlingRights)

    // If the move was a capture or a pawn move, reset the halfmove clock
    if (captureOrPawnMove) this.halfmoveClock = 0
    else this.halfmoveClock++

    // If the move was irreversible, reset the irreversible move clock; otherwise remember the position so that later we can check for threefold repetition
    if (captureOrPawnMove || oldCastlingRights !== this.castlingRights) {
      this.previousPositions = []
      this.previousPositionHashes = []
      this.irreversibleMoveClock = 0
    } else {
      this.previousPositions.push(oldState)
      this.previousPositionHashes.push(oldHash)
      this.irreversibleMoveClock++
    }

    // Update the side to move
    this.side = this.side === Color.White ? Color.Black : Color.White
    this.hash ^= zobristWhiteToMove
  }
}
