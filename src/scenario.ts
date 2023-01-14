// @ts-nocheck

export const scenario = {
  START: {
    steps: [{ text: 'Hi.' }],
    goto: 'INTRO_1',
  },
  INTRO: {
    scene: roomScene,
    steps: ["I'm Artyom. I made this game.", 'Let me show you something.'],
    goto: 'CHESS_INTRO',
  },
  CHESS_INTRO: {
    scene: disabledChessScene,
    steps: [
      'This is a chess engine I wrote.',
      'It only thinks three moves ahead.',
      'Also, it only considers how many points each player has.',
      'A pawn is 1, a knight is 3, and so on.',
      'Try beating it in ten moves or less.',
    ],
    goto: 'CHESS',
  },
  CHESS: {
    scene: chessScene({
      depth: 3,
      eval: ['material'],
    }),
  },
}
