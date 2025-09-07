import { P5CanvasInstance, SketchProps } from '@p5-wrapper/react'
import { Howl } from 'howler'
import { Board } from '@/board'
import { DrawConstants } from '@/draw/constants'
import { preloadPieceImages } from '@/draw/piece'
import { squareXY } from '@/draw/square'
import { GameMessage, GameMethods, GameProps } from '@/game/types'
import { Move, translateFromHumanMove } from '@/move'
import { Color, PieceEmpty } from '@/piece'
import { Coord } from '@/utils/coord'
import { match } from 'ts-pattern'
import { render } from '@/game/render'
import { IRenderableGameState, IChessState } from '@/game/render-types'
import { YjsBoardState } from './yjs-game'
import { CompatibleBoardState } from '@/game/types'

export class MultiplayerGameState {
  /** Chess board state. */
  board: Board

  /** Which piece is currently being dragged. */
  dragged: Coord | null = null

  /** Current multiplayer board state */
  multiplayerState: CompatibleBoardState | null = null

  constructor() {
    this.board = new Board()
  }

  /** Update board from multiplayer state */
  updateFromMultiplayerState(state: CompatibleBoardState) {
    this.multiplayerState = state

    // Update the board
    this.board.board = new Uint8Array(state.board)
    this.board.side = state.side
    // Update kings positions (already Coord instances in CompatibleBoardState)
    this.board.kings = state.kings
    // @ts-ignore - accessing private property for multiplayer sync
    this.board.castlingRights = state.castlingRights
    // Update en passant target square - convert plain object to Coord instance
    this.board.enPassantTargetSquare = state.enPassantTargetSquare
      ? new Coord(state.enPassantTargetSquare.x, state.enPassantTargetSquare.y)
      : null
    this.board.fullMoveNumber = state.fullMoveNumber
    this.board.halfMoveNumber = state.halfMoveNumber
  }

  /** Make a move without rule checking */
  makeMove(move: Move) {
    // Handle different move types
    switch (move.kind) {
      case 'normal': {
        const piece = this.board.at(move.from)
        if (piece !== PieceEmpty) {
          this.board.board[move.to.y * 8 + move.to.x] = move.promotion || piece
          this.board.board[move.from.y * 8 + move.from.x] = PieceEmpty

          // Update kings position if needed
          if (piece === 0x16) {
            // WhiteKing
            this.board.kings.white = move.to
          } else if (piece === 0x26) {
            // BlackKing
            this.board.kings.black = move.to
          }
        }
        break
      }
      case 'castling': {
        // Move king
        const king = this.board.at(move.kingFrom)
        this.board.board[move.kingTo.y * 8 + move.kingTo.x] = king
        this.board.board[move.kingFrom.y * 8 + move.kingFrom.x] = PieceEmpty

        // Move rook
        const rook = this.board.at(move.rookFrom)
        this.board.board[move.rookTo.y * 8 + move.rookTo.x] = rook
        this.board.board[move.rookFrom.y * 8 + move.rookFrom.x] = PieceEmpty

        // Update kings position
        if (king === 0x16) {
          // WhiteKing
          this.board.kings.white = move.kingTo
        } else if (king === 0x26) {
          // BlackKing
          this.board.kings.black = move.kingTo
        }
        break
      }
      case 'enPassant': {
        // Move pawn
        const piece = this.board.at(move.from)
        this.board.board[move.to.y * 8 + move.to.x] = piece
        this.board.board[move.from.y * 8 + move.from.x] = PieceEmpty

        // Remove captured pawn
        this.board.board[move.captureCoord.y * 8 + move.captureCoord.x] = PieceEmpty
        break
      }
    }

    // Toggle side to move
    this.board.side = this.board.side === Color.White ? Color.Black : Color.White
  }

  /** Reset to starting position */
  reset() {
    this.board = new Board()
    this.multiplayerState = null
  }
}

export const multiplayerSketch = (p5: P5CanvasInstance<SketchProps & GameProps>): GameMethods => {
  p5.disableFriendlyErrors = true

  let vars: GameProps = undefined as any
  let state: MultiplayerGameState = undefined as any

  let messageQueue: GameMessage[] = []

  const setupGlobals = () => {
    state = new MultiplayerGameState()
  }

  const reset = () => {
    p5.noLoop()
    messageQueue = []
    setupGlobals()
    if (vars) {
      vars.onOutputChange('')
      vars.onBestMoveChange(null)
      vars.onHistoryChange([])
      vars.onStatusChange('playing')
    }
    messageQueue.push({ type: 'doNothing' })
    p5.loop()
  }

  reset()

  p5.updateWithProps = (props: GameProps) => {
    console.debug('Updating multiplayer game vars', props)
    vars = props

    // Set up multiplayer callbacks
    if (props.multiplayerGame) {
      props.multiplayerGame.onBoardStateChangeCallback((boardState: YjsBoardState) => {
        // Convert YjsBoardState to compatible format for processing
        const compatibleState = {
          ...boardState,
          kings: {
            white: new Coord(boardState.kings.white.x, boardState.kings.white.y),
            black: new Coord(boardState.kings.black.x, boardState.kings.black.y),
          },
          enPassantTargetSquare: boardState.enPassantTargetSquare
            ? new Coord(boardState.enPassantTargetSquare.x, boardState.enPassantTargetSquare.y)
            : null,
        }
        messageQueue.push({ type: 'multiplayerBoardState', state: compatibleState })
      })

      props.multiplayerGame.onMoveCallback((move: Move) => {
        messageQueue.push({ type: 'multiplayerMove', move })
      })

      props.multiplayerGame.onResetCallback(() => {
        messageQueue.push({ type: 'multiplayerReset' })
      })
    }
  }

  const sounds = {
    move: new Howl({
      src: ['/assets/sounds/chess-blitz-sfx/piece-placement.mp3'],
    }),
    capture: new Howl({
      src: ['/assets/sounds/chess-blitz-sfx/piece-capture.mp3'],
      volume: 0.4,
    }),
  }

  /** Is the mouse hovering over a specific square? */
  const isTouching = (square: Coord) => {
    const xy = squareXY(p5, square)
    const between = (left: number, right: number, a: number) => left <= a && a < right
    return (
      between(xy.topLeft.x, xy.bottomRight.x, p5.mouseX) &&
      between(xy.topLeft.y, xy.bottomRight.y, p5.mouseY)
    )
  }

  p5.preload = () => {
    preloadPieceImages(p5)
    for (const sound of Object.values(sounds)) {
      sound.load()
    }
  }

  p5.setup = () => {
    const renderer = p5.createCanvas(DrawConstants(p5).CELL * 8, DrawConstants(p5).CELL * 8 + 20)
    stopTouchScrolling(renderer.elt)
  }

  p5.windowResized = () => {
    p5.resizeCanvas(DrawConstants(p5).CELL * 8, DrawConstants(p5).CELL * 8 + 20)
  }

  const processMessage = (message: GameMessage) => {
    console.debug('Processing multiplayer message', message)
    match(message)
      .with({ type: 'multiplayerBoardState' }, ({ state: boardState }) => {
        state.updateFromMultiplayerState(boardState)
        vars.onHistoryChange([]) // Clear history in multiplayer
      })
      .with({ type: 'multiplayerMove' }, ({ move }) => {
        state.makeMove(move)
        vars.onHistoryChange([]) // Clear history in multiplayer
      })
      .with({ type: 'multiplayerReset' }, () => {
        state.reset()
        vars.onHistoryChange([])
        vars.onStatusChange('playing')
      })
      .with({ type: 'doNothing' }, () => {
        return
      })
      .with({ type: 'makeMove' }, () => {
        // Not used in multiplayer mode
        return
      })
      .with({ type: 'updateBestMove' }, () => {
        // Not used in multiplayer mode
        return
      })
      .exhaustive()
  }

  p5.draw = () => {
    // Process a message from the queue
    const message = messageQueue.shift()
    if (message) processMessage(message)

    // Draw the current state of the game
    // Create a compatible state object for rendering
    const chessState: IChessState = {
      board: state.board,
      challenge: null,
      identity: null,
      history: [],
      bestMove: null,
      gameStatus: { status: 'playing' as const },
      isMoveAllowedByChallenge: () => true,
      lastMove: () => null,
    }

    const renderState: IRenderableGameState = {
      chess: chessState,
      dragged: state.dragged,
      lastMoveTimestamp: 0,
      makeMove: (move: Move) => state.makeMove(move),
      updateBestMoveAndGameStatus: () => {},
    }

    render(p5, renderState, vars)
  }

  // If we are touching a piece when the mouse is pressed, start dragging it
  p5.mousePressed = () => {
    if (!vars.controlsEnabled) return

    state.dragged = null
    for (const square of Board.allSquares()) {
      if (isTouching(square) && state.board.isOccupied(square)) {
        state.dragged = square
        return
      }
    }
  }

  p5.mouseReleased = () => {
    if (!vars.controlsEnabled) return

    if (state.dragged !== null) {
      let dest: Coord | null = Board.allSquares().find(isTouching) ?? null
      if (dest) {
        const move = translateFromHumanMove(state.board, { from: state.dragged, to: dest })
        if (move) {
          // In multiplayer mode, allow any move
          state.makeMove(move)

          // Send move to other player
          if (vars.multiplayerGame) {
            vars.multiplayerGame.makeMove(move)
          }

          // Play sound
          if (state.board.at(dest) !== PieceEmpty) {
            sounds.capture.play()
          } else {
            sounds.move.play()
          }
        }
      }
      state.dragged = null
    }
  }

  p5.keyPressed = () => {
    if (!vars.controlsEnabled) return
    // No special key handling in multiplayer mode
  }

  // Return methods / imperative handles
  return {
    reset: () => {
      state.reset()
      if (vars.multiplayerGame) {
        vars.multiplayerGame.resetBoard()
      }
    },
  }
}

/** Prevent scrolling when touching the canvas */
function stopTouchScrolling(canvas: Element) {
  document.body.addEventListener(
    'touchstart',
    function (e) {
      if (e.target === canvas) e.preventDefault()
    },
    { passive: false }
  )
  document.body.addEventListener(
    'touchend',
    function (e) {
      if (e.target === canvas) e.preventDefault()
    },
    { passive: false }
  )
  document.body.addEventListener(
    'touchmove',
    function (e) {
      if (e.target === canvas) e.preventDefault()
    },
    { passive: false }
  )
}
