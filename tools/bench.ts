import { Board } from '@/board'
import { Search } from '@/eval/search'
import { EvalNode } from '@/eval/node'
import _ from 'lodash'

for (let depth = 1; depth <= 6; depth++) {
  let board = new Board()
  let search = new Search()
  const start = Date.now()
  let moves = 0
  while (true) {
    const result = search.findBestMove(new EvalNode(board), depth)
    if (!result.move) break
    board.executeMove(result.move)
    moves++
  }
  const time = (Date.now() - start) / 1000
  const timePerMove = time / moves
  console.log(`Depth ${depth} took ${time.toFixed(3)}s (${timePerMove.toFixed(3)}s / move)`)
}
