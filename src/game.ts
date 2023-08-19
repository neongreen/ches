import { P5CanvasInstance, SketchProps } from '@p5-wrapper/react'
import { Howl } from 'howler'
import { Board } from './board'
import { Challenge } from './challenges/core'
import { DrawConstants } from './draw/constants'
import { preloadPieceImages } from './draw/piece'
import { squareXY } from './draw/square'
import { EvalNode } from './eval/node'
import { GameState } from './game/state'
import { GameMessage, GameMethods, GameProps } from './game/types'
import { Move, isCapture, notateMove, translateFromHumanMove } from './move'
import { isLegalMove, isLegalMoveWithExecute, legalMoves_slow } from './move/legal'
import { quasiLegalMoves, quasiLegalMovesFrom } from './move/quasi-legal'
import { Color } from './piece'
import { Coord } from './utils/coord'
import { Chess } from './game/chess'
import { match } from 'ts-pattern'
import { render } from './game/render'

export const sketch = (p5: P5CanvasInstance<SketchProps & GameProps>): GameMethods => {
  p5.disableFriendlyErrors = true

  // let synth: PolySynth

  let vars: GameProps = undefined as any
  let state: GameState = undefined as any

  let messageQueue: GameMessage[] = []

  const setupGlobals = (options: { challenge: Challenge | null }) => {
    state = new GameState(new Chess(options))
    // @ts-ignore
    window.Coord = Coord
    // @ts-ignore
    window.EvalNode = EvalNode
    // @ts-ignore
    window.chess = state.chess
    // @ts-ignore
    window.chess.isLegalMove = isLegalMoveWithExecute
    // @ts-ignore
    window.chess.legalMoves = legalMoves_slow
    // @ts-ignore
    window.chess.quasiLegalMoves = quasiLegalMoves
    // @ts-ignore
    window.chess.quasiLegalMovesFrom = quasiLegalMovesFrom
    // @ts-ignore
    window.chess.notateMove = notateMove
    // @ts-ignore
    window.chess.vars = vars
  }

  const reset = (options: { challenge: Challenge | null }) => {
    p5.noLoop()
    messageQueue = []
    setupGlobals(options)
    if (vars) {
      vars.onOutputChange('')
      vars.onBestMoveChange(null)
      vars.onHistoryChange([])
      vars.onStatusChange('playing')
    }
    messageQueue.push({ type: 'doNothing' }) // so that it has a chance to render
    messageQueue.push({ type: 'updateBestMove' })
    p5.loop()
  }

  reset({ challenge: null })

  p5.updateWithProps = (props: GameProps) => {
    console.debug('Updating game vars', props)
    vars = props
    if (props.challenge !== state.chess.challenge) {
      reset({ challenge: props.challenge })
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
    // @ts-ignore
    // synth = new p5.PolySynth()
  }

  p5.windowResized = () => {
    p5.resizeCanvas(DrawConstants(p5).CELL * 8, DrawConstants(p5).CELL * 8 + 20)
  }

  const processMessage = (message: GameMessage) => {
    console.debug('Processing message', message)
    match(message)
      .with({ type: 'makeMove' }, ({ move }) => {
        if (isCapture(move)) {
          sounds.capture.play()
        } else {
          sounds.move.play()
        }
        state.makeMove(move)
        vars.onHistoryChange([...state.chess.history])
        messageQueue.push({ type: 'updateBestMove' })
      })
      .with({ type: 'updateBestMove' }, () => {
        state.updateBestMoveAndGameStatus({ searchDepth: vars.searchDepth })
        vars.onStatusChange(state.chess.gameStatus.status)
        vars.onBestMoveChange(state.chess.bestMove)
      })
      .with({ type: 'doNothing' }, () => {
        return
      })
      .exhaustive()
  }

  p5.draw = () => {
    // Process a message from the queue
    const message = messageQueue.shift()
    if (message) processMessage(message)

    // Handle autoplay if necessary
    if (
      vars.autoPlayEnabled &&
      state.chess.bestMove &&
      state.chess.bestMove.move &&
      state.chess.board.side === Color.Black &&
      state.chess.gameStatus.status === 'playing' &&
      performance.now() - state.lastMoveTimestamp > GameState.AI_MOVE_DELAY
    ) {
      messageQueue.push({ type: 'makeMove', move: state.chess.bestMove.move })
    }

    // Draw the current state of the game
    render(p5, state, vars)

    // if (audioStarted) {
    //   if (frameCount % 15 === 0) {
    //     synth.play('C3', beatPattern[beat % beatPattern.length], 0, 0.1)
    //     beat++
    //   }
    // }
  }

  // If we are touching a piece when the mouse is pressed, start dragging it
  p5.mousePressed = () => {
    if (!vars.controlsEnabled) return

    // if (!audioStarted) {
    //   userStartAudio()
    //   audioStarted = true
    // }

    state.dragged = null
    for (const square of Board.allSquares()) {
      if (isTouching(square) && state.chess.board.isOccupied(square)) {
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
        const move = translateFromHumanMove(state.chess.board, { from: state.dragged, to: dest })
        if (move) {
          let boardAfterMove = state.chess.board.clone()
          boardAfterMove.executeMove(move)
          const isLegal = isLegalMove(state.chess.board, boardAfterMove, move)
          const isAllowedByChallenge =
            state.chess.board.side === Color.Black || state.chess.isMoveAllowedByChallenge(move)
          if (isLegal && isAllowedByChallenge) {
            messageQueue.push({ type: 'makeMove', move })
          }
        }
      }
      state.dragged = null
    }
  }

  p5.keyPressed = () => {
    if (!vars.controlsEnabled) return

    if (p5.key === ' ') {
      if (state.chess.bestMove?.move)
        messageQueue.push({ type: 'makeMove', move: state.chess.bestMove.move })
    }
  }

  // Return methods / imperative handles
  return { reset: () => reset({ challenge: vars.challenge }) }
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

// let beat = 0
// const beatPattern = [
//   ...[12, 7, 6, 5, 6, 5, 4, 3],
//   ...[20, 7, 6, 5, 6, 5, 4, 3],
//   ...[12, 7, 6, 5, 6, 5, 4, 3],
//   ...[32, 7, 6, 5, 6, 5, 4, 3],
// ].map((x) => Math.log2(x) / 5)

// let audioStarted = false
