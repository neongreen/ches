import _ from 'lodash'
import { P5CanvasInstance } from 'react-p5-wrapper'
import { match } from 'ts-pattern'
import { Board } from './board'
import { Challenge, challenges } from './chess-simp/challenge'
import { DrawConstants } from './draw/constants'
import { drawDraggedPiece, drawPiece, preloadPieceImages } from './draw/piece'
import { squareCenter } from './draw/square'
import { EvalNode } from './eval/node'
import { renderScore, Score } from './eval/score'
import { Search } from './eval/search'
import { Move, notateLine, translateFromHumanMove, translateToHumanMove } from './move'
import { isLegalMove, isLegalMoveWithExecute, legalMoves_slow } from './move/legal'
import { quasiLegalMoves, quasiLegalMovesFrom } from './move/quasiLegal'
import { Color, Piece } from './piece'
import { Coord } from './utils/coord'

/**
 * Create all widgets used in the UI.
 *
 * TODO: this sucks, migrate to React
 */
function createWidgets(p5: P5CanvasInstance): {
  depth: ReturnType<typeof p5.createSlider>
  autoPlay: ReturnType<typeof p5.createCheckbox> & { checked: () => boolean }
  showBestMove: ReturnType<typeof p5.createCheckbox> & { checked: () => boolean }
  showLine: ReturnType<typeof p5.createCheckbox> & { checked: () => boolean }
  outputBox: ReturnType<typeof p5.createDiv>
  chessSimpChallenge: Omit<ReturnType<typeof p5.createSelect>, 'value'> & {
    _value: () => string
    value: () => Challenge | null
  }
} {
  const depth = (() => {
    const depthContainer = p5.createDiv().style('display: flex')
    const depthLabel = p5.createSpan('Depth: ').parent(depthContainer)
    const depthSlider = p5
      .createSlider(/* min */ 1, /*max*/ 7, /* default */ 3, /* step */ 1)
      .parent(depthContainer)
    const depthValue = p5.createSpan(depthSlider.value().toString()).parent(depthContainer)
    depthSlider.elt.oninput = () => depthValue.html(depthSlider.value().toString())
    return depthSlider
  })()

  const chessSimpChallenge = (() => {
    const challengeContainer = p5.createDiv().style('display: flex')
    const challengeLabel = p5.createSpan('Chess Simp challenge: ').parent(challengeContainer)
    const challengeSelect: any = p5.createSelect().parent(challengeContainer)
    challengeSelect.option('-None-', '')
    challenges.map((challenge, i) => {
      challengeSelect.option(challenge.videoTitle, i.toString())
      return undefined
    })
    challengeSelect._value = challengeSelect.value
    challengeSelect.value = () => {
      if (challengeSelect._value() === '') {
        return null
      } else {
        return challenges[Number(challengeSelect._value())]
      }
    }
    return challengeSelect
  })()

  return {
    depth: depth,
    autoPlay: p5.createCheckbox('Black makes moves automatically', true) as any,
    showBestMove: p5.createCheckbox('Show the most devious move', false) as any,
    showLine: p5.createCheckbox('Show the line', false) as any,
    outputBox: p5.createDiv().style('font-family', 'monospace').style('max-width', '400px'),
    chessSimpChallenge: chessSimpChallenge as any,
  }
}

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

export const sketch = (p5: P5CanvasInstance) => {
  p5.disableFriendlyErrors = true

  // TODO: reenable sound
  // let synth

  const chess = new Chess()

  // For debug
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

  /** Which piece is currently being dragged */
  let dragged: Coord | null = null

  /** When was the last move made?
   *
   * If autoplay is enabled, we don't want to make the move immediately, but want to wait a little bit. Hence this variable.
   */
  let lastMoveTimestamp = 0

  /** Move delay for AI, in milliseconds */
  const AI_MOVE_DELAY = 400

  let widgets: ReturnType<typeof createWidgets>

  const makeMove = (move: Move) => {
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
    if (widgets.showBestMove.checked() && chess.bestMove?.move) {
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
  }

  p5.setup = () => {
    const renderer = p5.createCanvas(DrawConstants(p5).CELL * 8, DrawConstants(p5).CELL * 8 + 20)
    stopTouchScrolling(renderer.elt)
    widgets = createWidgets(p5)
    // synth = new p5.PolySynth()

    // DEBUG
    // @ts-ignore
    window.chess.widgets = widgets
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
      const bestMove = chess.search.findBestMove(
        new EvalNode(chess.board),
        Number(widgets.depth.value())
      )
      chess.bestMove = { ...bestMove, time: (performance.now() - startTime) / 1000 }
    }

    if (chess.bestMove.move && chess.board.side === Color.Black && widgets.autoPlay.checked()) {
      if (performance.now() - lastMoveTimestamp > AI_MOVE_DELAY) makeBestMove()
    } else {
      drawBestMove()
      // If the game is not over, show eval, otherwise show result
      const challenge = widgets.chessSimpChallenge.value()
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
          }
        )
        // Game over, we lost
        .when(
          () => chess.bestMove!.move === null && chess.bestMove!.score < 0,
          () => {
            p5.fill('red')
            p5.text('Checkmate. You lost.', 5, DrawConstants(p5).CELL * 8 + 14)
          }
        )
        // Game over, draw
        .when(
          () => chess.bestMove!.move === null && chess.bestMove!.score === 0,
          () => {
            p5.fill('black')
            p5.text('Draw', 5, DrawConstants(p5).CELL * 8 + 14)
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
        })
    }

    let newOutput = ''
    if (widgets.chessSimpChallenge.value()) {
      newOutput += widgets.chessSimpChallenge.value()?.challenge + '\n\n'
    }
    if (widgets.showLine.checked() && chess.bestMove) {
      const line = chess.bestMove.line
      newOutput +=
        notateLine(chess.board, line).join(' ') +
        (chess.board.isThreefoldRepetition() ? '\n\nThreefold repetition detected' : '') +
        '\n\n'
    }
    widgets.outputBox.elt.innerText = newOutput

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
    // No idea why, but when this function is called for the first time, widgets aren't initialized
    if (!widgets) return

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
          const challenge = widgets.chessSimpChallenge.value()
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
