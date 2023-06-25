import _ from 'lodash'
import { P5CanvasInstance } from '@p5-wrapper/react'
import { match } from 'ts-pattern'
import { Board } from './board'
import { DrawConstants } from './draw/constants'
import { drawDraggedPiece, drawPiece, preloadPieceImages } from './draw/piece'
import { squareCenter } from './draw/square'
import { EvalNode } from './eval/node'
import { renderScore, Score } from './eval/score'
import { Search } from './eval/search'
import { isCapture, Move, translateFromHumanMove, translateToHumanMove } from './move'
import { isLegalMove, isLegalMoveWithExecute, legalMoves_slow } from './move/legal'
import { quasiLegalMoves, quasiLegalMovesFrom } from './move/quasiLegal'
import { Color, Piece } from './piece'
import { Coord } from './utils/coord'
import { Howl } from 'howler'
import { Challenge } from './challenges/core'

class Chess {
  board = new Board()

  search = new Search()

  bestMove: {
    move: Move | null
    score: Score // The score (eval) of the best move
    time: number // How much time was spent on the eval
    line: Move[]
  } | null = null

  /**
   * Game history.
   */
  history: { boardBeforeMove: Board; move: Move }[] = []

  lastMove(): Move | null {
    return _.last(this.history)?.move ?? null
  }

  /** Make a move (assuming it's already been checked for legality) */
  makeMove(move: Move) {
    const boardBeforeMove = this.board.clone()
    this.board.executeMove(move)
    this.bestMove = null
    this.history.push({ boardBeforeMove, move })
  }
}

/**
 * A way to pass data from React to the sketch and vice-versa.
 */
export type SketchAttributes = {
  searchDepth: () => number
  autoPlayEnabled: () => boolean
  showBestMove: () => boolean
  currentChallenge: () => Challenge | null
  /**
   * Sketch will call this when the best move/line changes.
   */
  onBestMoveChange: (move: Chess['bestMove']) => void
  /**
   * Sketch will call this when it wants to communicate something (eg. debug output) to the user.
   */
  onOutputChange: (output: string) => void
  /**
   * Sketch will call this to inform React about the current status of the game.
   */
  onStatusChange: (status: 'playing' | 'won' | 'lost' | 'draw') => void
}

/**
 * A way to control the sketch from the outside world.
 */
export type SketchMethods = {
  /**
   * Reset the game.
   */
  reset: () => void
}

export const sketch = (env: SketchAttributes, p5: P5CanvasInstance): SketchMethods => {
  p5.disableFriendlyErrors = true

  // let synth: PolySynth

  let chess: Chess

  const setupGlobals = () => {
    chess = new Chess()
    // @ts-ignore
    window.Coord = Coord
    // @ts-ignore
    window.EvalNode = EvalNode
    // @ts-ignore
    window.chess = chess
    // @ts-ignore
    window.chess.isLegalMove = isLegalMoveWithExecute
    // @ts-ignore
    window.chess.quasiLegalMoves = quasiLegalMoves
    // @ts-ignore
    window.chess.quasiLegalMovesFrom = quasiLegalMovesFrom
    // @ts-ignore
    window.chess.env = env
  }

  setupGlobals()

  /** Which piece is currently being dragged */
  let dragged: Coord | null = null

  /** When was the last move made?
   *
   * If autoplay is enabled, we don't want to make the move immediately, but want to wait a little bit. Hence this variable.
   */
  let lastMoveTimestamp = 0

  /** Move delay for AI, in milliseconds */
  const AI_MOVE_DELAY = 500

  const sounds = {
    move: new Howl({
      src: [
        '/assets/sounds/30764__el_boss__chess-puzzle-blitz-sfx/546119__el_boss__piece-placement.mp3',
      ],
    }),
    capture: new Howl({
      src: [
        '/assets/sounds/30764__el_boss__chess-puzzle-blitz-sfx/546120__el_boss__piece-capture.mp3',
      ],
      volume: 0.4,
    }),
  }

  const makeMove = (move: Move) => {
    if (isCapture(chess.board, move)) {
      sounds.capture.play()
    } else {
      sounds.move.play()
    }
    chess.makeMove(move)
    lastMoveTimestamp = performance.now()
  }

  /** Make the best move for the current side */
  const makeBestMove = () => {
    if (chess.bestMove?.move) makeMove(chess.bestMove.move)
  }

  // Checkered board
  const drawBoard = () => {
    p5.push()
    p5.noStroke()
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const light = (x + y) % 2 !== 0
        p5.fill(light ? '#ebecd0' : '#779556') // Chess.com colors
        const xy = squareCenter(p5, new Coord(x, y))
        p5.rectMode(p5.CENTER)
        p5.square(xy.x, xy.y, DrawConstants(p5).CELL)
      }
    }
    p5.pop()
  }

  // Draw all pieces except the one currently being dragged
  const drawPieces = () => {
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        if (dragged === null || !(dragged.x === x && dragged.y === y))
          drawPiece(p5, new Coord(x, y), chess.board.at(new Coord(x, y)))
      }
    }
  }

  const drawLastMove = () => {
    const lastMove = chess.lastMove()
    if (lastMove) {
      const arrow = translateToHumanMove(lastMove)
      const fromCoord = squareCenter(p5, arrow.from)
      const toCoord = squareCenter(p5, arrow.to)
      p5.push()
      p5.stroke('rgba(0,0,0,0.5)')
      p5.strokeWeight(6)
      p5.line(fromCoord.x, fromCoord.y, toCoord.x, toCoord.y)
      p5.noFill()
      p5.strokeWeight(3)
      p5.pop()
    }
  }

  const drawBestMove = () => {
    if (env.showBestMove() && chess.bestMove?.move) {
      const arrow = translateToHumanMove(chess.bestMove.move)
      const fromCoord = squareCenter(p5, arrow.from)
      const toCoord = squareCenter(p5, arrow.to)
      p5.push()
      p5.stroke('rgba(255,0,0,0.5)')
      p5.strokeWeight(6)
      // Draw an arrow-like thing
      p5.line(fromCoord.x, fromCoord.y, toCoord.x, toCoord.y)
      p5.noFill()
      p5.strokeWeight(3)
      p5.circle(toCoord.x, toCoord.y, DrawConstants(p5).CELL * 0.75)
      p5.pop()
    }
  }

  /** Is the mouse hovering over a specific square?
   */
  const isTouching = (square: Coord) => {
    const { x: squareX, y: squareY } = squareCenter(p5, square)
    const between = (left: number, right: number, x: number) => left <= x && x < right
    return (
      between(
        squareX - DrawConstants(p5).CELL / 2,
        squareX + DrawConstants(p5).CELL / 2,
        p5.mouseX
      ) &&
      between(squareY - DrawConstants(p5).CELL / 2, squareY + DrawConstants(p5).CELL / 2, p5.mouseY)
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

  p5.draw = () => {
    p5.background(220)
    drawBoard()
    drawLastMove()
    drawPieces()
    if (dragged !== null) drawDraggedPiece(p5, chess.board.at(dragged))

    if (chess.bestMove === null) {
      const startTime = performance.now()
      const bestMove = chess.search.findBestMove(new EvalNode(chess.board), env.searchDepth())
      chess.bestMove = { ...bestMove, time: (performance.now() - startTime) / 1000 }
    }

    if (chess.bestMove) env.onBestMoveChange(chess.bestMove)

    if (chess.bestMove.move && chess.board.side === Color.Black && env.autoPlayEnabled()) {
      if (performance.now() - lastMoveTimestamp > AI_MOVE_DELAY) makeBestMove()
    } else {
      drawBestMove()
      // If the game is not over, show eval, otherwise show result
      const challenge = env.currentChallenge()
      const legalMoves = legalMoves_slow(chess.board)
      const legalMovesAfterChallenge = challenge
        ? legalMoves.filter((move) =>
            challenge.isMoveAllowed({ history: chess.history, board: chess.board, move })
          )
        : legalMoves
      match('')
        // Game over, we won
        .when(
          () => chess.bestMove!.move === null && chess.bestMove!.score > 0,
          () => {
            p5.fill('green')
            p5.text('Checkmate. You won!', 5, DrawConstants(p5).CELL * 8 + 14)
            env.onStatusChange('won')
          }
        )
        // Game over, we lost
        .when(
          () => chess.bestMove!.move === null && chess.bestMove!.score < 0,
          () => {
            p5.fill('red')
            p5.text('Checkmate. You lost.', 5, DrawConstants(p5).CELL * 8 + 14)
            env.onStatusChange('lost')
          }
        )
        // Game over, draw
        .when(
          () => chess.bestMove!.move === null && chess.bestMove!.score === 0,
          () => {
            p5.fill('black')
            const text = chess.board.isThreefoldRepetition()
              ? 'Draw by threefold repetition'
              : 'Draw'
            p5.text(text, 5, DrawConstants(p5).CELL * 8 + 14)
            env.onStatusChange('draw')
          }
        )
        // There are moves but all of them are illegal challenge-wise
        .when(
          () => legalMoves.length > 0 && legalMovesAfterChallenge.length === 0,
          () => {
            p5.fill('red')
            p5.text(
              'All possible moves fail the challenge. You lost.',
              5,
              DrawConstants(p5).CELL * 8 + 14
            )
            env.onStatusChange('lost')
          }
        )
        // The game goes on, show eval
        .otherwise(() => {
          p5.fill(0)
          const evalTime = Math.round(chess.bestMove!.time * 100) / 100
          p5.text(
            `eval: ${renderScore(chess.bestMove!.score)} (${evalTime}s)`,
            5,
            DrawConstants(p5).CELL * 8 + 14
          )
          env.onStatusChange('playing')
        })
    }

    // if (audioStarted) {
    //   if (frameCount % 15 === 0) {
    //     synth.play('C3', beatPattern[beat % beatPattern.length], 0, 0.1)
    //     beat++
    //   }
    // }
  }

  // If we are touching a piece when the mouse is pressed, start dragging it
  p5.mousePressed = () => {
    // if (!audioStarted) {
    //   userStartAudio()
    //   audioStarted = true
    // }

    dragged = null
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        if (isTouching(new Coord(x, y)) && chess.board.isOccupied(new Coord(x, y))) {
          dragged = new Coord(x, y)
          return
        }
      }
    }
  }

  p5.mouseReleased = () => {
    if (dragged !== null) {
      let dest: Coord | null = null
      for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
          const square = new Coord(x, y)
          if (isTouching(square)) dest = square
        }
      }
      if (dest) {
        const move = translateFromHumanMove(chess.board, { from: dragged, to: dest })
        if (move) {
          let boardAfterMove = chess.board.clone()
          boardAfterMove.executeMove(move)
          const isLegal = isLegalMove(chess.board, boardAfterMove, move)
          const challenge = env.currentChallenge()
          const isAllowedByChallenge =
            challenge === null ||
            challenge.isMoveAllowed({ history: chess.history, board: chess.board, move })
          if (isLegal && isAllowedByChallenge) makeMove(move)
        }
      }
      dragged = null
    }
  }

  p5.keyPressed = () => {
    if (p5.key === ' ') makeBestMove()
  }

  // Return methods / imperative handles
  return {
    reset: () => {
      setupGlobals()
      env.onOutputChange('')
      env.onBestMoveChange(null)
      env.onStatusChange('playing')
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

// let beat = 0
// const beatPattern = [
//   ...[12, 7, 6, 5, 6, 5, 4, 3],
//   ...[20, 7, 6, 5, 6, 5, 4, 3],
//   ...[12, 7, 6, 5, 6, 5, 4, 3],
//   ...[32, 7, 6, 5, 6, 5, 4, 3],
// ].map((x) => Math.log2(x) / 5)

// let audioStarted = false
