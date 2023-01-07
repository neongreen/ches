p5.disableFriendlyErrors = true

// Square size, in pixels
const CELL = 60

// Piece size
const PIECE = CELL * 1

let pieceImages = {}

function preload() {
  pieceImages.k = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Chess_kdt45.svg/240px-Chess_kdt45.svg.png'
  )
  pieceImages.q = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Chess_qdt45.svg/240px-Chess_qdt45.svg.png'
  )
  pieceImages.r = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Chess_rdt45.svg/240px-Chess_rdt45.svg.png'
  )
  pieceImages.b = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Chess_bdt45.svg/240px-Chess_bdt45.svg.png'
  )
  pieceImages.n = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Chess_ndt45.svg/240px-Chess_ndt45.svg.png'
  )
  pieceImages.p = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Chess_pdt45.svg/240px-Chess_pdt45.svg.png'
  )
  pieceImages.K = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Chess_klt45.svg/240px-Chess_klt45.svg.png'
  )
  pieceImages.Q = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Chess_qlt45.svg/240px-Chess_qlt45.svg.png'
  )
  pieceImages.R = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Chess_rlt45.svg/240px-Chess_rlt45.svg.png'
  )
  pieceImages.B = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Chess_blt45.svg/240px-Chess_blt45.svg.png'
  )
  pieceImages.N = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Chess_nlt45.svg/240px-Chess_nlt45.svg.png'
  )
  pieceImages.P = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Chess_plt45.svg/240px-Chess_plt45.svg.png'
  )
}

let currentBoard = new Board()

let currentEval = null

/** Which piece is currently being dragged.
 *
 * @type {Coord | null}
 */
let dragged = null

function setup() {
  createCanvas(CELL * 8, CELL * 8 + 20)
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

/** Draw one piece.
 *
 * @param {Coord} coord
 */
function drawPiece(coord) {
  push()
  imageMode(CENTER)
  const { x: squareX, y: squareY } = squareCenter(coord)
  if (pieceImages[currentBoard.at(coord)]) {
    image(pieceImages[currentBoard.at(coord)], squareX, squareY, PIECE, PIECE)
  }
  pop()
}

// Draw the currently dragged piece
function drawDraggedPiece() {
  push()
  imageMode(CENTER)
  const piece = currentBoard.at(dragged)
  image(pieceImages[piece], mouseX, mouseY, PIECE * 1.3, PIECE * 1.3)
  pop()
}

// Draw all pieces except the one currently being dragged
function drawPieces() {
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      if (dragged === null || !(dragged.x === x && dragged.y === y))
        drawPiece({ x, y })
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
  if (dragged !== null) drawDraggedPiece()

  if (currentEval === null) currentEval = evalNode(new EvalNode(currentBoard))
  drawBestMove()

  fill(0)
  text(`eval: ${currentEval.eval}`, 5, CELL * 8 + 14)

  // noLoop();
}

// If we are touching a piece when the mouse is pressed, start dragging it
function mousePressed() {
  dragged = null
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      if (isTouching(new Coord(x, y))) {
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
          // TODO: remove assumeQuasiLegal
          if (isLegalMove(currentBoard, move, { assumeQuasiLegal: true })) {
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
