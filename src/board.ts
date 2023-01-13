import { Color, isPawn, letterToPiece, Piece } from '@/piece'
import { Coord } from '@/utils/coord'
import { Move } from '@/move'
import { match, P } from 'ts-pattern'
import MurmurHash from 'imurmurhash'

type PositionHash = number

/** Game state representation. Includes pieces, whose move it is, etc. */
export class Board {
  board: Uint8Array

  /**
   * Whose move it is now.
   */
  side: Color

  /**
   * Castling rights.
   */
  castling: {
    white: { kingside: boolean; queenside: boolean }
    black: { kingside: boolean; queenside: boolean }
  }

  /**
   * Previous positions, indexed by their `hash()`. Used to detect three-fold repetition.
   *
   * This map is cleared after each irreversible move (pawn moves, captures, castling).
   *
   * Since collisions are possible, map values are arrays of `state()`s.
   */
  previousPositions: Map<PositionHash, string[]> = new Map()

  /**
   * The number of half-moves since the last irreversible move (pawn moves, captures, castling).
   *
   * If it's 0, the last move was irreversible.
   *
   * Invariant: this is the sum of the lengths of arrays in `#previousPositions`.
   */
  irreversibleMoveClock = 0

  /**
   * Create a new board.
   *
   * By default, the board is set up in the standard chess starting position.
   */
  constructor() {
    this.board = new Uint8Array(64).fill(Piece.Empty)
    this.side = Color.White
    this.castling = {
      white: { kingside: true, queenside: true },
      black: { kingside: true, queenside: true },
    }
    this.setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  }

  /**
   * Return a copy of the board.
   */
  clone() {
    const clone = new Board()
    clone.board = new Uint8Array(this.board)
    clone.side = this.side
    clone.castling = {
      white: { ...this.castling.white },
      black: { ...this.castling.black },
    }
    clone.previousPositions = new Map(
      Array.from(this.previousPositions.entries()).map(([hash, states]) => [hash, [...states]])
    )
    clone.irreversibleMoveClock = this.irreversibleMoveClock
    return clone
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
   * Return a hash of the position.
   *
   * If two hashes are different, the positions are different with respect to the three-fold repetition rule. However, collisions are possible.
   */
  hash(state?: string): PositionHash {
    return new MurmurHash(state || this.state()).result()
  }

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
    const positionHash = this.hash()
    const previousStates = this.previousPositions.get(positionHash)
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
    this.side = side === 'w' ? Color.White : Color.Black
    this.board = new Uint8Array(64).fill(Piece.Empty)
    this.castling = {
      white: { kingside: castling.includes('K'), queenside: castling.includes('Q') },
      black: { kingside: castling.includes('k'), queenside: castling.includes('q') },
    }

    let rows = pieces.split('/')
    rows.reverse()
    for (let y = 0; y < 8; y++) {
      let x = 0
      for (const char of rows[y]) {
        if (char >= '1' && char <= '8') {
          x += parseInt(char)
        } else {
          this.setAt(new Coord(x, y), letterToPiece(char))
          x++
        }
      }
    }
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
      const currentState = this.state()
      const currentHash = this.hash(currentState)
      const previousStates = this.previousPositions.get(currentHash)
      if (previousStates === undefined) {
        this.previousPositions.set(currentHash, [currentState])
      } else {
        previousStates.push(currentState)
      }
      this.irreversibleMoveClock++
    }

    match(move)
      .with({ kind: 'normal' }, (move) => {
        const piece = this.at(move.from)
        const target = this.at(move.to)

        let irreversibleMove = false

        // If the king is moved, castling rights are lost and the move is irreversible
        const anyWhiteCastling = this.castling.white.kingside || this.castling.white.queenside
        const anyBlackCastling = this.castling.black.kingside || this.castling.black.queenside
        if (piece === Piece.WhiteKing && anyWhiteCastling) {
          irreversibleMove = true
          this.castling.white = { kingside: false, queenside: false }
        } else if (piece === Piece.BlackKing && anyBlackCastling) {
          irreversibleMove = true
          this.castling.black = { kingside: false, queenside: false }
        }
        // If a rook is moved from its original position, castling rights are lost and the move is irreversible
        else if (piece === Piece.WhiteRook) {
          if (move.from.equals(new Coord(0, 0)) && this.castling.white.queenside) {
            irreversibleMove = true
            this.castling.white.queenside = false
          } else if (move.from.equals(new Coord(7, 0)) && this.castling.white.kingside) {
            irreversibleMove = true
            this.castling.white.kingside = false
          }
        } else if (piece === Piece.BlackRook) {
          if (move.from.equals(new Coord(0, 7)) && this.castling.black.queenside) {
            irreversibleMove = true
            this.castling.black.queenside = false
          } else if (move.from.equals(new Coord(7, 7)) && this.castling.black.kingside) {
            irreversibleMove = true
            this.castling.black.kingside = false
          }
        }

        // If a rook is captured, castling rights are also lost and the move is irreversible
        if (target === Piece.WhiteRook) {
          if (move.to.equals(new Coord(0, 0)) && this.castling.white.queenside) {
            irreversibleMove = true
            this.castling.white.queenside = false
          } else if (move.to.equals(new Coord(7, 0)) && this.castling.white.kingside) {
            irreversibleMove = true
            this.castling.white.kingside = false
          }
        } else if (target === Piece.BlackRook) {
          if (move.to.equals(new Coord(0, 7)) && this.castling.black.queenside) {
            irreversibleMove = true
            this.castling.black.queenside = false
          } else if (move.to.equals(new Coord(7, 7)) && this.castling.black.kingside) {
            irreversibleMove = true
            this.castling.black.kingside = false
          }
        }

        // Captures and pawn moves are also irreversible
        if (target !== Piece.Empty || isPawn(piece)) irreversibleMove = true

        if (irreversibleMove) onIrreversibleMove()
        else onReversibleMove()

        // Finally, update the board
        this.setAt(move.to, move.promotion ? move.promotion : this.at(move.from))
        this.setAt(move.from, Piece.Empty)
      })
      .with({ kind: 'castling' }, (move) => {
        onIrreversibleMove()
        if (this.side === Color.White) {
          this.setAt(move.kingFrom, Piece.Empty)
          this.setAt(move.kingTo, Piece.WhiteKing)
          this.setAt(move.rookFrom, Piece.Empty)
          this.setAt(move.rookTo, Piece.WhiteRook)
          this.castling.white = { kingside: false, queenside: false }
        } else {
          this.setAt(move.kingFrom, Piece.Empty)
          this.setAt(move.kingTo, Piece.BlackKing)
          this.setAt(move.rookFrom, Piece.Empty)
          this.setAt(move.rookTo, Piece.BlackRook)
          this.castling.black = { kingside: false, queenside: false }
        }
      })
      .exhaustive()
    this.side = this.side === Color.White ? Color.Black : Color.White
  }
}
