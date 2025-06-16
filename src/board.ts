import {
  Color,
  isPawn,
  letterToPiece,
  makePiece,
  MaybePiece,
  Piece,
  PieceEmpty,
  pieceToLetter,
  PieceType,
} from '@/piece'
import { Coord } from '@/utils/coord'
import { Move } from '@/move'
import { Zobrist, zobristCastling, zobristPiece, zobristWhiteToMove } from './zobrist'
import { Castling, CastlingBitmask } from './utils/castling'

/**
 * Game state representation. Includes pieces, whose move it is, etc.
 *
 * We store a `stack` variant of some of the internal variables — those are needed for undoing moves.
 */
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
  private castlingRightsStack: CastlingBitmask[]

  /** Is there a castling right for X? */
  hasCastling(x: Castling): boolean {
    return Boolean(this.castlingRights & x)
  }

  /**
   * If the last move was a double pawn push, this is the "target square" for en passant captures - that is, the square behind the pawn that was pushed.
   */
  enPassantTargetSquare: Coord | null = null
  private enPassantTargetSquareStack: (Coord | null)[]

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
   * Move history.
   */
  moveHistory: Move[]

  /**
   * Current position as a binary string.
   *
   * We don't care about the contents of the string as long as the following invariant holds: if two strings are the same, the positions are the same with respect to the three-fold repetition rule.
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
   * A hash of the position.
   *
   * If two hashes are different, the positions are different with respect to the three-fold repetition rule. However, collisions are possible. You'll need to check `state` as well to be sure.
   */
  hash: Zobrist
  hashStack: Zobrist[]

  /**
   * THREEFOLD REPETITION: `irreversibleMoveClock` is the number of half-moves since the last irreversible move (pawn moves, captures, castling). If it's 0, the last move was irreversible.
   */
  irreversibleMoveClock = 0
  private irreversibleMoveClockStack: number[]

  /**
   * FIFTY-MOVE RULE: `halfmoveClock` is the number of half-moves since the last capture or pawn move. If it's 0, the last move was a capture or pawn move.
   *
   * See https://www.chessprogramming.org/Halfmove_Clock
   */
  halfmoveClock = 0
  private halfmoveClockStack: number[]

  fullMoveNumber = 1
  halfMoveNumber = 1

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
      this.state = board.state
      this.hash = board.hash
      this.irreversibleMoveClock = board.irreversibleMoveClock
      this.halfmoveClock = board.halfmoveClock
      this.fullMoveNumber = board.fullMoveNumber
      this.halfMoveNumber = board.halfMoveNumber
      this.moveHistory = board.moveHistory.slice()
      this.castlingRightsStack = board.castlingRightsStack.slice()
      this.enPassantTargetSquareStack = board.enPassantTargetSquareStack.slice()
      this.irreversibleMoveClockStack = board.irreversibleMoveClockStack.slice()
      this.halfmoveClockStack = board.halfmoveClockStack.slice()
      this.hashStack = board.hashStack.slice()
    } else {
      // We don't actually care about anything because `setFen` will overwrite everything, but things seem to be slower if we use {} etc.
      this.board = new Uint8Array(64)
      this.side = Color.White
      this.castlingRights = Castling.None
      this.kings = { white: new Coord(4, 0), black: new Coord(4, 7) }
      this.hash = 0
      this.moveHistory = []
      this.castlingRightsStack = []
      this.enPassantTargetSquareStack = []
      this.irreversibleMoveClockStack = []
      this.halfmoveClockStack = []
      this.hashStack = []

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
   * Print the board as a string with newlines etc.
   */
  debugShow(): string {
    let str = ''
    for (let y = 7; y >= 0; y--) {
      for (let x = 0; x < 8; x++) {
        str += pieceToLetter(this.unsafeAt(new Coord(x, y)))
      }
      str += '\n'
    }
    return str
  }

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

    // We search from the end, because it's more likely that the repetition is recent. We also need to search only as far as the last irreversible move.
    let probabilisticResult = false
    {
      let count = 0
      for (let i = 0; i < this.irreversibleMoveClock; i++) {
        if (this.hashStack.at(-i - 1) === this.hash) count++
        if (count >= 2) {
          probabilisticResult = true
          break
        }
      }
    }
    // If hashes didn't match, we know we don't have a threefold repetition.
    if (!probabilisticResult) return false

    // Otherwise we still need to check the actual positions, which is expensive. Let's do it.
    {
      let count = 0
      const board = this.clone()
      const state = this.state()
      for (let i = 0; i < this.irreversibleMoveClock; i++) {
        board.unmakeMove()
        if (board.state() === state) count++
        if (count >= 2) return true
      }
      return false
    }
  }

  /**
   * Return the piece at coordinates (x, y).
   *
   * The bottom left corner is (0, 0) and the top right corner is (7, 7).
   *
   * If the coordinates are off the board, returns Piece.Empty.
   */
  at(coord: Coord): MaybePiece {
    if (!coord.isValid()) return PieceEmpty
    return this.board[coord.y * 8 + coord.x]
  }

  /** Return the piece at coordinates (x, y).
   *
   * Doesn't check if the coordinates are off the board.
   */
  unsafeAt(coord: Coord): MaybePiece {
    if (process.env.NODE_ENV === 'test') {
      if (!coord.isValid()) throw new Error(`Invalid coordinates: ${coord.toString()}`)
    }
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
        if (piece !== PieceEmpty) pieces.push({ coord, piece })
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
  private replace(coord: Coord, pieceOld: MaybePiece, pieceNew: MaybePiece) {
    this.hash ^= zobristPiece(pieceOld, coord) ^ zobristPiece(pieceNew, coord)
    this.board[coord.y * 8 + coord.x] = pieceNew
    if (pieceNew === Piece.WhiteKing) this.kings.white = coord
    if (pieceNew === Piece.BlackKing) this.kings.black = coord
  }

  /**
   * Set the piece at coordinates (x, y).
   *
   * Doesn't update the hash or the kings position.
   */
  private unsafeSet(coord: Coord, piece: MaybePiece) {
    if (process.env.NODE_ENV === 'test') {
      if (!coord.isValid()) throw new Error(`Invalid coordinates: ${coord.toString()}`)
    }
    this.board[coord.y * 8 + coord.x] = piece
  }

  /**
   * Is a square empty? NB: returns undefined if the square is off the board.
   */
  isEmpty(coord: Coord): boolean | undefined {
    if (!coord.isValid()) return undefined
    return this.unsafeAt(coord) === PieceEmpty
  }

  unsafeIsEmpty(coord: Coord): boolean {
    return this.unsafeAt(coord) === PieceEmpty
  }

  /**
   * Is a square occupied? NB: returns undefined if the square is off the board.
   */
  isOccupied(coord: Coord): boolean | undefined {
    if (!coord.isValid()) return undefined
    return this.unsafeAt(coord) !== PieceEmpty
  }

  unsafeIsOccupied(coord: Coord): boolean {
    return this.unsafeAt(coord) !== PieceEmpty
  }

  /**
   * Keep going until we stumble upon a piece or fall off the board.
   *
   * @param start The starting square, assumed to be valid.
   * @param delta The direction to move in.
   */
  unsafeFindPieceInDirection(
    start: Coord,
    delta: { x: number; y: number }
  ): { piece: Piece; coord: Coord } | null {
    let coord = start
    while (true) {
      coord = coord.shift(delta)
      if (!coord.isValid()) return null
      const piece = this.unsafeAt(coord)
      if (piece !== PieceEmpty) return { piece, coord }
    }
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
    this.irreversibleMoveClock = 0 // FEN doesn't have this info
    this.fullMoveNumber = parseInt(fullmove, 10)
    this.halfMoveNumber =
      this.side === Color.White ? this.fullMoveNumber * 2 - 1 : this.fullMoveNumber * 2

    this.moveHistory = []

    this.castlingRightsStack = []
    this.enPassantTargetSquareStack = []
    this.irreversibleMoveClockStack = []
    this.halfmoveClockStack = []
    this.hashStack = []

    this.board = new Uint8Array(64).fill(PieceEmpty)
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
          this.replace(coord, PieceEmpty, piece)
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
    // We remember old castling rights so that later we can see if they have changed
    const oldCastlingRights = this.castlingRights

    // For the fifty-move rule
    let captureOrPawnMove = false

    // Update all stacks
    this.castlingRightsStack.push(this.castlingRights)
    this.enPassantTargetSquareStack.push(this.enPassantTargetSquare)
    this.irreversibleMoveClockStack.push(this.irreversibleMoveClock)
    this.halfmoveClockStack.push(this.halfmoveClock)
    this.hashStack.push(this.hash)

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
          if (target !== PieceEmpty || isPawn(piece)) captureOrPawnMove = true

          // Update the board
          this.replace(move.to, target, move.promotion ? move.promotion : piece)
          this.replace(move.from, piece, PieceEmpty)
        }
        break
      case 'castling':
        {
          this.enPassantTargetSquare = null

          if (this.side === Color.White) {
            // TODO: "move" instead of "replace"?
            this.replace(move.kingFrom, Piece.WhiteKing, PieceEmpty)
            this.replace(move.kingTo, PieceEmpty, Piece.WhiteKing)
            this.replace(move.rookFrom, Piece.WhiteRook, PieceEmpty)
            this.replace(move.rookTo, PieceEmpty, Piece.WhiteRook)
            this.castlingRights &= ~Castling.WhiteAny
          } else {
            this.replace(move.kingFrom, Piece.BlackKing, PieceEmpty)
            this.replace(move.kingTo, PieceEmpty, Piece.BlackKing)
            this.replace(move.rookFrom, Piece.BlackRook, PieceEmpty)
            this.replace(move.rookTo, PieceEmpty, Piece.BlackRook)
            this.castlingRights &= ~Castling.BlackAny
          }
        }
        break
      case 'enPassant':
        {
          this.enPassantTargetSquare = null
          if (this.side === Color.White) {
            this.replace(move.from, Piece.WhitePawn, PieceEmpty)
            this.replace(move.to, PieceEmpty, Piece.WhitePawn)
            this.replace(move.captureCoord, Piece.BlackPawn, PieceEmpty)
          } else {
            this.replace(move.from, Piece.BlackPawn, PieceEmpty)
            this.replace(move.to, PieceEmpty, Piece.BlackPawn)
            this.replace(move.captureCoord, Piece.WhitePawn, PieceEmpty)
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

    // If the move was irreversible, reset the irreversible move clock
    if (captureOrPawnMove || oldCastlingRights !== this.castlingRights) {
      this.irreversibleMoveClock = 0
    } else {
      this.irreversibleMoveClock++
    }

    // The full move number is incremented after Black's move
    if (this.side === Color.Black) this.fullMoveNumber++
    this.halfMoveNumber++

    // Update the side to move
    this.side = this.side === Color.White ? Color.Black : Color.White
    this.hash ^= zobristWhiteToMove

    this.moveHistory.push(move)
  }

  /**
   * Fast "unmake move".
   *
   * @returns The move that was unmade.
   */
  unmakeMove() {
    this.castlingRights = this.castlingRightsStack.pop()!
    this.enPassantTargetSquare = this.enPassantTargetSquareStack.pop()!
    this.irreversibleMoveClock = this.irreversibleMoveClockStack.pop()!
    this.halfmoveClock = this.halfmoveClockStack.pop()!
    this.hash = this.hashStack.pop()!

    const move = this.moveHistory.pop()!

    if (this.side === Color.White) this.fullMoveNumber--
    this.halfMoveNumber--
    this.side = this.side === Color.White ? Color.Black : Color.White

    switch (move.kind) {
      case 'normal':
        {
          const mover =
            move.promotion === null ? this.unsafeAt(move.to) : makePiece(this.side, PieceType.Pawn)
          this.unsafeSet(move.from, mover)
          this.unsafeSet(move.to, move.capture)
          if (mover === Piece.WhiteKing) this.kings.white = move.from
          if (mover === Piece.BlackKing) this.kings.black = move.from
        }
        break
      case 'enPassant':
        {
          const mover = this.unsafeAt(move.to)
          this.unsafeSet(move.from, mover)
          this.unsafeSet(move.captureCoord, move.capture)
          // Note: when doing en passant, we are guaranteed that the target square is empty
          this.unsafeSet(move.to, PieceEmpty)
        }
        break
      case 'castling':
        {
          // Looking at the new (ie. old!) side already — that is, the side that made the `move` in question
          if (this.side === Color.White) {
            this.unsafeSet(move.kingFrom, Piece.WhiteKing)
            this.unsafeSet(move.kingTo, PieceEmpty)
            this.unsafeSet(move.rookFrom, Piece.WhiteRook)
            this.unsafeSet(move.rookTo, PieceEmpty)
            this.kings.white = move.kingFrom
          } else {
            this.unsafeSet(move.kingFrom, Piece.BlackKing)
            this.unsafeSet(move.kingTo, PieceEmpty)
            this.unsafeSet(move.rookFrom, Piece.BlackRook)
            this.unsafeSet(move.rookTo, PieceEmpty)
            this.kings.black = move.kingFrom
          }
        }
        break
    }

    return move
  }
}
