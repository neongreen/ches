import { Color, isPawn, letterToPiece, Piece } from '@/piece'
import { Coord } from '@/utils/coord'
import { Move } from '@/move'
import { Zobrist, zobristCastling, zobristPiece, zobristWhiteToMove } from './zobrist'

/** Game state representation. Includes pieces, whose move it is, etc. */
export class Board {
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
  castling: {
    white: { kingside: boolean; queenside: boolean }
    black: { kingside: boolean; queenside: boolean }
  }

  /**
   * Previous positions, indexed by their `hash`. Used to detect three-fold repetition.
   *
   * This map is cleared after each irreversible move (pawn moves, captures, castling).
   *
   * Since collisions are possible, map values are arrays of `state()`s.
   */
  previousPositions: Map<Zobrist, string[]> = new Map()

  /**
   * THREEFOLD REPETITION: `irreversibleMoveClock` is the number of half-moves since the last irreversible move (pawn moves, captures, castling). If it's 0, the last move was irreversible.
   *
   * Invariant: this is also the sum of the lengths of arrays in `#previousPositions`.
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
      this.castling = { white: { ...board.castling.white }, black: { ...board.castling.black } }
      this.previousPositions = new Map(
        Array.from(board.previousPositions.entries()).map(([hash, states]) => [hash, [...states]])
      )
      this.hash = board.hash
      this.irreversibleMoveClock = board.irreversibleMoveClock
      this.halfmoveClock = board.halfmoveClock
    } else {
      // We don't actually care about anything because `setFen` will overwrite everything,
      // but things seem to be slower if we use {} etc.
      this.board = new Uint8Array(64)
      this.side = Color.White
      this.castling = {
        white: { kingside: true, queenside: true },
        black: { kingside: true, queenside: true },
      }
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
   * Return the position as a weird binary-ish string.
   *
   * If two strings are the same, the positions are the same with respect to the three-fold repetition rule.
   */
  state(): string {
    return String.fromCharCode(
      ...this.board,
      this.side,
      Number(this.castling.white.kingside),
      Number(this.castling.white.queenside),
      Number(this.castling.black.kingside),
      Number(this.castling.black.queenside)
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
    // So there must be at least four positions in the map. (If there are three positions,
    // only one of them will be from the same side to move as the current side.)
    if (this.irreversibleMoveClock < 4) return false
    const previousStates = this.previousPositions.get(this.hash)
    if (!previousStates) return false
    const positionState = this.state()
    return previousStates.filter((x) => x === positionState).length >= 2
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
   * Set the piece at coordinates (x, y).
   */
  setAt(coord: Coord, piece: Piece) {
    this.board[coord.y * 8 + coord.x] = piece
  }

  /**
   * Is a square empty? NB: returns undefined if the square is off the board.
   */
  isEmpty(coord: Coord): boolean | undefined {
    if (!coord.isValid()) return undefined
    return this.at(coord) === Piece.Empty
  }

  /**
   * Is a square occupied? NB: returns undefined if the square is off the board.
   */
  isOccupied(coord: Coord): boolean | undefined {
    if (!coord.isValid()) return undefined
    return this.at(coord) !== Piece.Empty
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
    if (this.side === Color.White) this.hash += zobristWhiteToMove

    this.castling = {
      white: { kingside: castling.includes('K'), queenside: castling.includes('Q') },
      black: { kingside: castling.includes('k'), queenside: castling.includes('q') },
    }
    if (this.castling.white.kingside) this.hash += zobristCastling.white.kingside
    if (this.castling.white.queenside) this.hash += zobristCastling.white.queenside
    if (this.castling.black.kingside) this.hash += zobristCastling.black.kingside
    if (this.castling.black.queenside) this.hash += zobristCastling.black.queenside

    this.halfmoveClock = parseInt(halfmove, 10)
    this.previousPositions = new Map()

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
          this.setAt(coord, piece)
          if (piece === Piece.WhiteKing) this.kings.white = coord
          if (piece === Piece.BlackKing) this.kings.black = coord
          this.hash += zobristPiece(piece, coord)
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
    const onIrreversibleMove = () => {
      this.irreversibleMoveClock = 0
      this.previousPositions.clear()
    }

    const onReversibleMove = () => {
      const previousStates = this.previousPositions.get(this.hash)
      if (previousStates === undefined) {
        this.previousPositions.set(this.hash, [this.state()])
      } else {
        previousStates.push(this.state())
      }
      this.irreversibleMoveClock++
    }

    switch (move.kind) {
      case 'normal':
        {
          const piece = this.at(move.from)
          const target = this.at(move.to)

          let irreversibleMove = false // For the threefold repetition draw rule
          let captureOrPawnMove = false // For the fifty-move rule

          // If the king is moved, castling rights are lost and the move is irreversible
          const anyWhiteCastling = this.castling.white.kingside || this.castling.white.queenside
          const anyBlackCastling = this.castling.black.kingside || this.castling.black.queenside
          if (piece === Piece.WhiteKing && anyWhiteCastling) {
            irreversibleMove = true
            if (this.castling.white.kingside) this.hash -= zobristCastling.white.kingside
            if (this.castling.white.queenside) this.hash -= zobristCastling.white.queenside
            this.castling.white = { kingside: false, queenside: false }
          } else if (piece === Piece.BlackKing && anyBlackCastling) {
            irreversibleMove = true
            if (this.castling.black.kingside) this.hash -= zobristCastling.black.kingside
            if (this.castling.black.queenside) this.hash -= zobristCastling.black.queenside
            this.castling.black = { kingside: false, queenside: false }
          }
          // If a rook is moved from its original position, castling rights are lost and the move is irreversible
          else if (piece === Piece.WhiteRook) {
            if (move.from.equals(new Coord(0, 0)) && this.castling.white.queenside) {
              irreversibleMove = true
              this.hash -= zobristCastling.white.queenside
              this.castling.white.queenside = false
            } else if (move.from.equals(new Coord(7, 0)) && this.castling.white.kingside) {
              irreversibleMove = true
              this.hash -= zobristCastling.white.kingside
              this.castling.white.kingside = false
            }
          } else if (piece === Piece.BlackRook) {
            if (move.from.equals(new Coord(0, 7)) && this.castling.black.queenside) {
              irreversibleMove = true
              this.hash -= zobristCastling.black.queenside
              this.castling.black.queenside = false
            } else if (move.from.equals(new Coord(7, 7)) && this.castling.black.kingside) {
              irreversibleMove = true
              this.hash -= zobristCastling.black.kingside
              this.castling.black.kingside = false
            }
          }

          // If a rook is captured, castling rights are also lost and the move is irreversible
          if (target === Piece.WhiteRook) {
            if (move.to.equals(new Coord(0, 0)) && this.castling.white.queenside) {
              irreversibleMove = true
              this.hash -= zobristCastling.white.queenside
              this.castling.white.queenside = false
            } else if (move.to.equals(new Coord(7, 0)) && this.castling.white.kingside) {
              irreversibleMove = true
              this.hash -= zobristCastling.white.kingside
              this.castling.white.kingside = false
            }
          } else if (target === Piece.BlackRook) {
            if (move.to.equals(new Coord(0, 7)) && this.castling.black.queenside) {
              irreversibleMove = true
              this.hash -= zobristCastling.black.queenside
              this.castling.black.queenside = false
            } else if (move.to.equals(new Coord(7, 7)) && this.castling.black.kingside) {
              irreversibleMove = true
              this.hash -= zobristCastling.black.kingside
              this.castling.black.kingside = false
            }
          }

          // Captures and pawn moves are irreversible *and* reset the halfmove clock
          if (target !== Piece.Empty || isPawn(piece)) {
            irreversibleMove = true
            captureOrPawnMove = true
          }

          // Ok, now face the music
          if (irreversibleMove) onIrreversibleMove()
          else onReversibleMove()
          if (captureOrPawnMove) this.halfmoveClock = 0
          else this.halfmoveClock++

          // If the king is moved, update the king position
          if (piece === Piece.WhiteKing) this.kings.white = move.to
          else if (piece === Piece.BlackKing) this.kings.black = move.to

          // Update the hash regarding moved pieces
          this.hash -= zobristPiece(piece, move.from)
          if (target !== Piece.Empty) this.hash -= zobristPiece(target, move.to)
          this.hash += zobristPiece(move.promotion ? move.promotion : piece, move.to)

          // Update the board
          this.setAt(move.to, move.promotion ? move.promotion : piece)
          this.setAt(move.from, Piece.Empty)
        }
        break
      case 'castling':
        {
          onIrreversibleMove()
          this.halfmoveClock++
          if (this.side === Color.White) {
            // Move the pieces
            this.setAt(move.kingFrom, Piece.Empty)
            this.setAt(move.kingTo, Piece.WhiteKing)
            this.setAt(move.rookFrom, Piece.Empty)
            this.setAt(move.rookTo, Piece.WhiteRook)
            this.hash =
              this.hash -
              zobristPiece(Piece.WhiteKing, move.kingFrom) +
              zobristPiece(Piece.WhiteKing, move.kingTo) -
              zobristPiece(Piece.WhiteRook, move.rookFrom) +
              zobristPiece(Piece.WhiteRook, move.rookTo)
            // Update castling rights
            if (this.castling.white.kingside) this.hash -= zobristCastling.white.kingside
            if (this.castling.white.queenside) this.hash -= zobristCastling.white.queenside
            this.castling.white = { kingside: false, queenside: false }
            // Update the king position
            this.kings.white = move.kingTo
          } else {
            // Move the pieces
            this.setAt(move.kingFrom, Piece.Empty)
            this.setAt(move.kingTo, Piece.BlackKing)
            this.setAt(move.rookFrom, Piece.Empty)
            this.setAt(move.rookTo, Piece.BlackRook)
            this.hash =
              this.hash -
              zobristPiece(Piece.BlackKing, move.kingFrom) +
              zobristPiece(Piece.BlackKing, move.kingTo) -
              zobristPiece(Piece.BlackRook, move.rookFrom) +
              zobristPiece(Piece.BlackRook, move.rookTo)
            // Update castling rights
            if (this.castling.black.kingside) this.hash -= zobristCastling.black.kingside
            if (this.castling.black.queenside) this.hash -= zobristCastling.black.queenside
            this.castling.black = { kingside: false, queenside: false }
            // Update the king position
            this.kings.black = move.kingTo
          }
        }
        break
    }
    if (this.side === Color.White) {
      this.side = Color.Black
      this.hash -= zobristWhiteToMove
    } else {
      this.side = Color.White
      this.hash += zobristWhiteToMove
    }
  }
}
