p5.disableFriendlyErrors = true

// Square size, in pixels
const CELL = 60

// Piece size
const PIECE = CELL * 1

function preload() {
  preloadPieceImages()
}

let currentBoard = new Board()
let currentEval = null

/** Which piece is currently being dragged.
 *
 * @type {Coord | null}
 */
let dragged = null

/** Prevent scrolling when touching the canvas */
function stopTouchScrolling(canvas) {
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

function setup() {
  createCanvas(CELL * 8, CELL * 8 + 20)
  stopTouchScrolling(document.querySelector('canvas'))
}

// Checkered board
function drawBoard() {
  push()
  noStroke()
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      const light = (x + y) % 2 !== 0
      fill(light ? 240 : 170)
      const xy = squareCenter(new Coord(x, y))
      rectMode(CENTER)
      square(xy.x, xy.y, CELL)
    }
  }
  pop()
}

/** Is the mouse hovering over a specific square?
 *
 * @param {Coord} square
 */
function isTouching(square) {
  const { x: squareX, y: squareY } = squareCenter(square)
  const between = (left, right, x) => left <= x && x < right
  return (
    between(squareX - CELL / 2, squareX + CELL / 2, mouseX) &&
    between(squareY - CELL / 2, squareY + CELL / 2, mouseY)
  )
}

// Draw all pieces except the one currently being dragged
function drawPieces() {
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      if (dragged === null || !(dragged.x === x && dragged.y === y))
        drawPiece(new Coord(x, y), currentBoard.at(new Coord(x, y)))
    }
  }
}

function drawBestMove() {
  if (currentEval.bestMove) {
    const { from, to } = currentEval.bestMove
    const fromCoord = squareCenter(from)
    const toCoord = squareCenter(to)
    push()
    stroke('rgba(255,0,0,0.5)')
    strokeWeight(6)
    // Draw an arrow
    line(fromCoord.x, fromCoord.y, toCoord.x, toCoord.y)
    noFill()
    strokeWeight(3)
    circle(toCoord.x, toCoord.y, CELL * 0.75)
    pop()
  }
}

function draw() {
  background(220)
  drawBoard()
  drawPieces()
  if (dragged !== null) drawDraggedPiece(currentBoard.at(dragged))

  if (currentEval === null) {
    const startTime = performance.now()
    currentEval = findBestMove(new EvalNode(currentBoard), MAX_DEPTH)
    currentEval.time = (performance.now() - startTime) / 1000
  }
  drawBestMove()

  fill(0)
  const evalEval = Math.round(currentEval.eval * 100) / 100
  const evalSign = evalEval > 0 ? '+' : ''
  const evalTime = Math.round(currentEval.time * 100) / 100
  text(
    `eval: ${evalSign}${evalEval.toFixed(2)} (${evalTime}s)`,
    5,
    CELL * 8 + 14
  )

  // noLoop();
}

// If we are touching a piece when the mouse is pressed, start dragging it
function mousePressed() {
  dragged = null
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      if (
        isTouching(new Coord(x, y)) &&
        currentBoard.isOccupied(new Coord(x, y))
      ) {
        dragged = new Coord(x, y)
        return
      }
    }
  }
}

function mouseReleased() {
  if (dragged !== null) {
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        if (isTouching(new Coord(x, y))) {
          // We found the square we are dropping the piece on
          const move = { kind: 'normal', from: dragged, to: new Coord(x, y) }
          if (isLegalMove(currentBoard, move)) {
            currentBoard.executeMove(move)
            currentEval = null
          }
        }
      }
    }
    dragged = null
  }
}

function keyPressed() {
  // Do best move
  if (key === ' ') {
    if (currentEval.bestMove) {
      currentBoard.executeMove(currentEval.bestMove)
      currentEval = null
    }
  }
}
