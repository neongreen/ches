p5.disableFriendlyErrors = true;

// Размер квадратика
const CELL = 50;

// Размер фигур
const PIECE = CELL * 1;

let pieceImages = {};

function preload() {
  pieceImages.k = loadImage(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Chess_kdt45.svg/240px-Chess_kdt45.svg.png"
  );
  pieceImages.q = loadImage(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Chess_qdt45.svg/240px-Chess_qdt45.svg.png"
  );
  pieceImages.r = loadImage(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Chess_rdt45.svg/240px-Chess_rdt45.svg.png"
  );
  pieceImages.b = loadImage(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Chess_bdt45.svg/240px-Chess_bdt45.svg.png"
  );
  pieceImages.n = loadImage(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Chess_ndt45.svg/240px-Chess_ndt45.svg.png"
  );
  pieceImages.p = loadImage(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Chess_pdt45.svg/240px-Chess_pdt45.svg.png"
  );
  pieceImages.K = loadImage(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Chess_klt45.svg/240px-Chess_klt45.svg.png"
  );
  pieceImages.Q = loadImage(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Chess_qlt45.svg/240px-Chess_qlt45.svg.png"
  );
  pieceImages.R = loadImage(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Chess_rlt45.svg/240px-Chess_rlt45.svg.png"
  );
  pieceImages.B = loadImage(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Chess_blt45.svg/240px-Chess_blt45.svg.png"
  );
  pieceImages.N = loadImage(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Chess_nlt45.svg/240px-Chess_nlt45.svg.png"
  );
  pieceImages.P = loadImage(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Chess_plt45.svg/240px-Chess_plt45.svg.png"
  );
}

let currentPos = {
  side: "white",
  board: [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    ["-", "-", "-", "-", "-", "-", "-", "-"],
    ["-", "-", "-", "-", "-", "-", "-", "-"],
    ["-", "-", "-", "-", "-", "-", "-", "-"],
    ["-", "-", "-", "-", "-", "-", "-", "-"],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"],
  ],
};
currentPos.material = {
  white: currentPos.board
    .flat()
    .filter((x) => pieceColor(x) === "white")
    .map(piecePoints)
    .reduce((a, b) => a + b, 0),
  black: currentPos.board
    .flat()
    .filter((x) => pieceColor(x) === "black")
    .map(piecePoints)
    .reduce((a, b) => a + b, 0),
};

let currentEval = null;

// Which piece is being dragged
let draggedIndex = null;

function setup() {
  createCanvas(CELL * 8, CELL * 8 + 20);
}

// Checkered board
function drawBoard() {
  noStroke();
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      if ((x + y) % 2 !== 0) {
        fill(170);
      } else {
        fill(240);
      }
      square(x * CELL, y * CELL, CELL);
    }
  }
}

// Is the mouse hovering over a specific square
function isTouching(square) {
  const squareX = square.x * CELL;
  const squareY = square.y * CELL;
  return (
    squareX < mouseX &&
    mouseX < squareX + CELL &&
    squareY < mouseY &&
    mouseY < squareY + CELL
  );
}

// Is a specific square empty
function isEmpty({ x, y }) {
  return currentPos.board[y][x] === "-";
}

// Draw one piece
function drawPiece({ x, y }) {
  push();
  imageMode(CENTER);
  const squareX = x * CELL;
  const squareY = y * CELL;
  if (pieceImages[currentPos.board[y][x]]) {
    image(
      pieceImages[currentPos.board[y][x]],
      squareX + CELL / 2,
      squareY + CELL / 2,
      PIECE,
      PIECE
    );
  }
  pop();
}

// Draw the currently dragged piece
function drawDraggedPiece() {
  push();
  imageMode(CENTER);
  image(
    pieceImages[currentPos.board[draggedIndex.y][draggedIndex.x]],
    mouseX,
    mouseY,
    PIECE * 1.3,
    PIECE * 1.3
  );
  pop();
}

// Draw all pieces except the one currently being dragged
function drawPieces() {
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      if (
        draggedIndex === null ||
        !(draggedIndex.x === x && draggedIndex.y === y)
      )
        drawPiece({ x, y });
    }
  }
}

function draw() {
  background(220);
  drawBoard();
  drawPieces();
  if (draggedIndex !== null) drawDraggedPiece();

  if (currentEval === null) currentEval = evalPos(currentPos);

  fill(0);
  text(
    `eval: ${currentEval.eval}, move: ${JSON.stringify(currentEval.move)}`,
    5,
    CELL * 8 + 14
  );

  // noLoop();
}

// If we are touching a piece when the mouse is pressed, start dragging it
function mousePressed() {
  draggedIndex = null;
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      if (isTouching({ x, y })) {
        draggedIndex = { x, y };
        return;
      }
    }
  }
}

// TODO
function mouseReleased() {
  if (draggedIndex !== null) {
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        if (isTouching({ x, y }) && isEmpty({ x, y })) {
          pieces[draggedIndex] = { x, y };
        }
      }
    }
    draggedIndex = null;
  }
}
