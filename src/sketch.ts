import { P5CanvasInstance } from 'react-p5-wrapper'
import { match } from 'ts-pattern'
import { Board } from './board'
import { DrawConstants } from './draw/constants'
import { drawDraggedPiece, drawPiece, preloadPieceImages } from './draw/piece'
import { squareCenter } from './draw/square'
import { findBestMove, findBestMoves, MAX_DEPTH, renderEval } from './eval/eval'
import { EvalNode } from './eval/node'
import { Move, notateLine } from './move'
import { isLegalMove } from './move/legal'
import { castlingMoves } from './move/pieces/king'
import { Color, Piece } from './piece'
import { Coord } from './utils/coord'

export const sketch = (p5: P5CanvasInstance) => {
  p5.disableFriendlyErrors = true

  // TODO: reenable sound
  // let synth

  let currentBoard = new Board()
  let currentEval: {
    bestMove: Move | null
    eval: number
    time: number
    lines?: { move: Move | null; eval: number; line: Move[] }[]
  } | null = null

  /** Which piece is currently being dragged */
  let dragged: Coord | null = null

  /** When was the last move made?
   *
   * If autoplay is enabled, we don't want to make the move immediately, but want to wait a little bit. Hence this variable.
   */
  let lastMoveTimestamp = 0

  let autoPlay: ReturnType<typeof p5.createCheckbox>
  let showLines: ReturnType<typeof p5.createCheckbox>
  let outputBox: ReturnType<typeof p5.createDiv>

  /** Move delay for AI, in milliseconds */
  const AI_MOVE_DELAY = 400

  /** Make the best move for the current side */
  const makeBestMove = () => {
    if (currentEval?.bestMove) makeMove(currentEval.bestMove)
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
          drawPiece(p5, new Coord(x, y), currentBoard.at(new Coord(x, y)))
      }
    }
  }

  const drawBestMove = () => {
    if (currentEval?.bestMove) {
      const { from, to } = match(currentEval.bestMove)
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

  /** Make a move (assuming it's already been checked for legality) */
  const makeMove = (move: Move) => {
    currentBoard.executeMove(move)
    currentEval = null
    lastMoveTimestamp = performance.now()
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
    autoPlay = p5.createCheckbox('Black makes moves automatically', true)
    showLines = p5.createCheckbox('Show lines', false)
    outputBox = p5.createDiv().style('font-family', 'monospace')
    // synth = new p5.PolySynth()
  }

  p5.windowResized = () => {
    p5.resizeCanvas(DrawConstants(p5).CELL * 8, DrawConstants(p5).CELL * 8 + 20)
  }

  p5.draw = () => {
    p5.background(220)
    drawBoard()
    drawPieces()
    if (dragged !== null) drawDraggedPiece(p5, currentBoard.at(dragged))

    if (currentEval === null) {
      const startTime = performance.now()
      const newEval = findBestMove(new EvalNode(currentBoard), MAX_DEPTH)
      currentEval = { ...newEval, time: (performance.now() - startTime) / 1000 }
    }
    if (
      currentEval.bestMove &&
      currentBoard.side === Color.Black &&
      // @ts-ignore
      autoPlay.checked()
    ) {
      if (performance.now() - lastMoveTimestamp > AI_MOVE_DELAY) makeBestMove()
    } else {
      drawBestMove()
      p5.fill(0)
      const evalTime = Math.round(currentEval.time * 100) / 100
      p5.text(
        `eval: ${renderEval(currentEval.eval)} (${evalTime}s)`,
        5,
        DrawConstants(p5).CELL * 8 + 14
      )
    }

    if (
      // @ts-ignore
      showLines.checked() &&
      currentEval
    ) {
      if (currentEval?.lines !== undefined) {
        outputBox.elt.innerText = currentEval.lines
          .map(
            (line) =>
              `${renderEval(line.eval).padStart(6, '\xa0')} - ` +
              `${notateLine(currentBoard, line.line).join(' ')}`
          )
          .join('\n')
      } else {
        currentEval.lines = findBestMoves(new EvalNode(currentBoard), MAX_DEPTH, 5)
      }
    } else {
      outputBox.elt.innerText = ''
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
        if (isTouching(new Coord(x, y)) && currentBoard.isOccupied(new Coord(x, y))) {
          dragged = new Coord(x, y)
          return
        }
      }
    }
  }

  p5.mouseReleased = () => {
    if (dragged !== null) {
      const coord: Coord = dragged
      const piece = currentBoard.at(coord)
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
            if (isLegalMove(currentBoard, move)) makeMove(move)
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
      if (e.target == canvas) e.preventDefault()
    },
    { passive: false }
  )
  document.body.addEventListener(
    'touchend',
    function (e) {
      if (e.target == canvas) e.preventDefault()
    },
    { passive: false }
  )
  document.body.addEventListener(
    'touchmove',
    function (e) {
      if (e.target == canvas) e.preventDefault()
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
