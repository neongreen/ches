import { P5CanvasInstance, SketchProps } from '@p5-wrapper/react'
import { GameProps } from './types'
import { GameState } from './state'
import { Board } from '@/board'
import { DrawConstants } from '@/draw/constants'
import { drawPiece, drawDraggedPiece } from '@/draw/piece'
import { squareXY } from '@/draw/square'
import { renderScore } from '@/eval/score'
import { translateToHumanMove } from '@/move'
import { match } from 'ts-pattern'

export function render(
  p5: P5CanvasInstance<SketchProps & GameProps>,
  state: GameState,
  vars: GameProps
) {
  // Chess.com colors
  const colors = {
    light: '#ebecd0',
    dark: '#779556',
    highlight: {
      blue: 'rgba(82, 176, 220, 0.8)',
      red: 'rgba(235, 97, 80, 0.8)',
      lightYellow: 'rgba(235, 227, 80, 0.5)', // custom
      lightRed: 'rgba(235, 97, 80, 0.5)', // custom
    },
  }

  // Checkered board
  const drawBoard = () => {
    const highlights =
      state.chess.challenge?.highlightSquares?.({
        board: state.chess.board,
        identity: state.chess.identity,
        history: state.chess.history,
      }) ?? []
    p5.push()
    p5.noStroke()
    for (const square of Board.allSquares()) {
      const light = (square.x + square.y) % 2 !== 0
      const squareColor: string = light ? colors.light : colors.dark
      const contrastColor: string = light ? colors.dark : colors.light
      p5.fill(squareColor)
      const xy = squareXY(p5, square)
      p5.rectMode(p5.CENTER)
      p5.square(xy.center.x, xy.center.y, DrawConstants(p5).CELL)
      // Rank and file labels
      p5.textSize(10)
      p5.textStyle(p5.BOLD)
      if (square.x === 0) {
        p5.textAlign(p5.LEFT, p5.TOP)
        p5.fill(light ? colors.dark : colors.light)
        p5.text(square.y + 1, xy.topLeft.x + 3, xy.topLeft.y + 3)
      }
      if (square.y === 0) {
        p5.textAlign(p5.RIGHT, p5.BOTTOM)
        p5.fill(contrastColor)
        p5.text('abcdefgh'[square.x], xy.bottomRight.x - 3, xy.bottomRight.y - 3)
      }
      // Highlight if the challenge says so
      const highlight = highlights.find((x) => x.coord.equals(square))
      if (highlight) {
        p5.fill(colors.highlight[highlight.color])
        p5.square(xy.center.x, xy.center.y, DrawConstants(p5).CELL)
        if (highlight.text) {
          p5.textSize(15)
          p5.textAlign(p5.RIGHT, p5.TOP)
          p5.fill('#444')
          p5.text(highlight.text, xy.topRight.x - 3, xy.topRight.y + 3)
        }
      }
    }
    p5.pop()
  }

  // Draw all pieces except the one currently being dragged
  const drawPieces = () => {
    for (const square of Board.allSquares()) {
      if (state.dragged === null || !state.dragged.equals(square))
        drawPiece(p5, square, state.chess.board.at(square))
    }
  }

  const drawLastMove = () => {
    const lastMove = state.chess.lastMove()
    if (lastMove) {
      const arrow = translateToHumanMove(lastMove)
      const fromXY = squareXY(p5, arrow.from)
      const toXY = squareXY(p5, arrow.to)
      p5.push()
      p5.stroke('rgba(0,0,0,0.5)')
      p5.strokeWeight(6)
      p5.line(fromXY.center.x, fromXY.center.y, toXY.center.x, toXY.center.y)
      p5.noFill()
      p5.strokeWeight(3)
      p5.pop()
    }
  }

  const drawBestMove = () => {
    if (vars.showBestMove && state.chess.bestMove?.move) {
      const arrow = translateToHumanMove(state.chess.bestMove.move)
      const fromXY = squareXY(p5, arrow.from)
      const toXY = squareXY(p5, arrow.to)
      p5.push()
      p5.stroke('rgba(255,0,0,0.5)')
      p5.strokeWeight(6)
      // Draw an arrow-like thing
      p5.line(fromXY.center.x, fromXY.center.y, toXY.center.x, toXY.center.y)
      p5.noFill()
      p5.strokeWeight(3)
      p5.circle(toXY.center.x, toXY.center.y, DrawConstants(p5).CELL * 0.75)
      p5.pop()
    }
  }

  const drawStatus = () => {
    p5.fill(
      match(state.chess.gameStatus)
        .with({ status: 'playing' }, () => 'black')
        .with({ status: 'won' }, () => 'green')
        .with({ status: 'lost' }, () => 'red')
        .with({ status: 'draw' }, () => 'black')
        .exhaustive()
    )
    const statusText = match(state.chess.gameStatus)
      .with({ status: 'playing' }, () => {
        if (state.chess.bestMove === null) return 'Thinking...'
        const score = state.chess.bestMove.score
        const evalTime = Math.round(state.chess.bestMove.time * 100) / 100
        // Show nodes per second stats - see /docs/nps.md
        const nodesPerSecond = Math.round(state.chess.bestMove.nodes / state.chess.bestMove.time)
        let formattedNPS: string
        if (nodesPerSecond >= 1_000_000) {
          formattedNPS = (nodesPerSecond / 1_000_000).toFixed(1) + 'M'
        } else if (nodesPerSecond >= 1_000) {
          formattedNPS = (nodesPerSecond / 1_000).toFixed(0) + 'k'
        } else {
          formattedNPS = nodesPerSecond.toString()
        }
        return `eval: ${renderScore(score)} (${evalTime}s, ${formattedNPS} NPS)`
      })
      .with({ status: 'won', reason: 'checkmate' }, () => 'Checkmate. You won!')
      .with({ status: 'lost', reason: 'checkmate' }, () => 'Checkmate. You lost.')
      .with({ status: 'lost', reason: 'challengeFailed' }, () => 'You lost the challenge.')
      .with(
        { status: 'lost', reason: 'challengeNoMovesAvailable' },
        () => 'All possible moves fail the challenge. You lost.'
      )
      .with(
        { status: 'draw', reason: 'threefoldRepetition' },
        () => 'Draw by threefold repetition.'
      )
      .with({ status: 'draw', reason: 'other' }, () => 'Draw.')
      .exhaustive()
    p5.text(statusText, 5, DrawConstants(p5).CELL * 8 + 14)
  }

  p5.background(220)
  drawBoard()
  drawLastMove()
  drawPieces()
  if (state.dragged !== null) drawDraggedPiece(p5, state.chess.board.at(state.dragged))
  drawBestMove()
  drawStatus()
}
