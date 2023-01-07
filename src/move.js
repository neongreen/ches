/** Move generator */

// pieceColor(piece: Piece): 'white' | 'black'
function pieceColor(piece) {
  if ("A" <= piece && piece <= "Z") return "white";
  if ("a" <= piece && piece <= "z") return "black";
  return "-";
}

function invertColor(color) {
  if (color === "white") return "black";
  else return "white";
}

/**
  generateMoves(pos: Position, options: {
    // Allow all normal moves even if the side to move is in check
    ignoreCheck: boolean
  }): ...
*/
function generateMoves(pos, options) {
  let moves = [];
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      if (pieceColor(pos.board[y][x]) === pos.side) {
        moves.push(...quasiLegalNormalMoves(pos, { x, y }));
      }
    }
  }
  moves = moves.filter((m) =>
    isLegalMove(pos, m, { ...options, assumeQuasiLegal: true })
  );
  return moves;
}

// Determines if the side to move is in check
function isInCheck(pos) {
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      if (
        (pos.side === "white" && pos.board[y][x] === "K") ||
        (pos.side === "black" && pos.board[y][x] === "k")
      ) {
        return isAttacked(pos, { x, y });
      }
    }
  }
}

function executeMove(pos, move) {
  let newBoard = pos.board.map((row) => [...row]);

  if (move.kind === "normal") {
    const destination = newBoard[move.to.y][move.to.x];
    let newMaterial = { ...pos.material };
    switch (pieceColor(destination)) {
      case "-":
        break;
      case "white":
        newMaterial.white -= piecePoints(destination);
        break;
      case "black":
        newMaterial.black -= piecePoints(destination);
        break;
    }
    newBoard[move.to.y][move.to.x] = newBoard[move.from.y][move.from.x];
    newBoard[move.from.y][move.from.x] = "-";
    return {
      ...pos,
      side: invertColor(pos.side),
      board: newBoard,
      material: newMaterial,
    };
  }
}
