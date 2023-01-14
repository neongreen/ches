import { P5CanvasInstance } from 'react-p5-wrapper'
import { match } from 'ts-pattern'
import { Board } from './board'
import { DrawConstants } from './draw/constants'
import { drawDraggedPiece, drawPiece, preloadPieceImages } from './draw/piece'
import { squareCenter } from './draw/square'
import { findBestMove, renderEval } from './eval/eval'
import { EvalNode } from './eval/node'
import { Move, notateLine } from './move'
import { isLegalMove, isLegalMoveAndExecute } from './move/legal'
import { castlingMoves } from './move/pieces/king'
import { quasiLegalMoves, quasiLegalMovesFrom } from './move/quasiLegal'
import { Color, Piece } from './piece'
import { Coord } from './utils/coord'

function createWidgets(p5: P5CanvasInstance): {
  depth: ReturnType<typeof p5.createSlider>
  autoPlay: ReturnType<typeof p5.createCheckbox> & { checked: () => boolean }
  showBestMove: ReturnType<typeof p5.createCheckbox> & { checked: () => boolean }
  showLine: ReturnType<typeof p5.createCheckbox> & { checked: () => boolean }
  outputBox: ReturnType<typeof p5.createDiv>
} {
  const depthContainer = p5.createDiv().style('display: flex')
  const depthLabel = p5.createSpan('Depth: ').parent(depthContainer)
  const depth = p5
    .createSlider(/* min */ 1, /*max*/ 7, /* default */ 3, /* step */ 1)
    .parent(depthContainer)
  const depthValue = p5.createSpan(depth.value().toString()).parent(depthContainer)
  depth.elt.oninput = () => depthValue.html(depth.value().toString())
  return {
    depth,
    autoPlay: p5.createCheckbox('Black makes moves automatically', true) as any,
    showBestMove: p5.createCheckbox('Show the most devious move', false) as any,
    showLine: p5.createCheckbox('Show the line', false) as any,
    outputBox: p5.createDiv().style('font-family', 'monospace'),
  }
}

class Chess {
  board: Board = new Board()
  bestMove: {
    move: Move | null
    eval: number
    time: number // How much time was spent on the eval
    line: Move[]
  } | null = null

  /** Make a move (assuming it's already been checked for legality) */
  makeMove(move: Move) {
    this.board.executeMove(move)
    this.bestMove = null
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
  window.chess.isLegalMove = isLegalMoveAndExecute
  // @ts-ignore
  window.chess.quasiLegalMoves = quasiLegalMoves
  // @ts-ignore
  window.chess.quasiLegalMovesFrom = quasiLegalMovesFrom
  // @ts-ignore
  window.chess.findBestMove = findBestMove

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
        p5.fill(light ? 240 : 170)
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

  const drawBestMove = () => {
    if (widgets.showBestMove.checked() && chess.bestMove?.move) {
      const { from, to } = match(chess.bestMove.move)
        .with({ kind: 'normal' }, ({ from, to }) => ({ from, to }))
        .with({ kind: 'castling' }, ({ kingFrom, kingTo }) => ({ from: kingFrom, to: kingTo }))
        .exhaustive()
      const fromCoord = squareCenter(p5, from)
      const toCoord = squareCenter(p5, to)
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
  }

  p5.windowResized = () => {
    p5.resizeCanvas(DrawConstants(p5).CELL * 8, DrawConstants(p5).CELL * 8 + 20)
  }

  p5.draw = () => {
    p5.background(220)
    drawBoard()
    drawPieces()
    if (dragged !== null) drawDraggedPiece(p5, chess.board.at(dragged))

    if (chess.bestMove === null) {
      const startTime = performance.now()
      const bestMove = findBestMove(new EvalNode(chess.board), Number(widgets.depth.value()))
      chess.bestMove = { ...bestMove, time: (performance.now() - startTime) / 1000 }
    }
    if (chess.bestMove.move && chess.board.side === Color.Black && widgets.autoPlay.checked()) {
      if (performance.now() - lastMoveTimestamp > AI_MOVE_DELAY) makeBestMove()
    } else {
      drawBestMove()
      p5.fill(0)
      const evalTime = Math.round(chess.bestMove.time * 100) / 100
      p5.text(
        `eval: ${renderEval(chess.bestMove.eval)} (${evalTime}s)`,
        5,
        DrawConstants(p5).CELL * 8 + 14
      )
    }

    if (widgets.showLine.checked() && chess.bestMove) {
      const line = chess.bestMove.line
      widgets.outputBox.elt.innerText =
        notateLine(chess.board, line).join(' ') +
        (chess.board.isThreefoldRepetition() ? '\n\nThreefold repetition detected' : '')
    } else {
      widgets.outputBox.elt.innerText = ''
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
      const coord: Coord = dragged
      const piece = chess.board.at(coord)
      for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
          const dest = new Coord(x, y)
          if (isTouching(dest)) {
            // We found the square we are dropping the piece on
            const move: Move = match('')
              .when(
                () => piece === Piece.WhiteKing && dest.x - coord.x > 1,
                () => ({ kind: 'castling', ...castlingMoves.white.kingside } satisfies Move)
              )
              .when(
                () => piece === Piece.WhiteKing && dest.x - coord.x < -1,
                () => ({ kind: 'castling', ...castlingMoves.white.queenside } satisfies Move)
              )
              .when(
                () => piece === Piece.BlackKing && dest.x - coord.x > 1,
                () => ({ kind: 'castling', ...castlingMoves.black.kingside } satisfies Move)
              )
              .when(
                () => piece === Piece.BlackKing && dest.x - coord.x < -1,
                () => ({ kind: 'castling', ...castlingMoves.black.queenside } satisfies Move)
              )
              .otherwise(
                () =>
                  ({
                    kind: 'normal',
                    from: coord,
                    to: dest,
                    ...(piece === Piece.WhitePawn && y === 7
                      ? { promotion: Piece.WhiteQueen }
                      : {}),
                    ...(piece === Piece.BlackPawn && y === 0
                      ? { promotion: Piece.BlackQueen }
                      : {}),
                  } satisfies Move)
              )
            let boardAfterMove = chess.board.clone()
            boardAfterMove.executeMove(move)
            if (isLegalMove(chess.board, boardAfterMove, move)) makeMove(move)
          }
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
