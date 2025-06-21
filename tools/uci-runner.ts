import { spawn } from 'child_process'
import readline from 'node:readline'
import { Board } from '@/board'
import { notateMove } from '@/move'
import { parseUciMove } from '@/uci'
import { Search } from '@/eval/search'
import { EvalNode } from '@/eval/node'
import { Color } from '@/piece'
import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'

async function waitForLine(rl: readline.Interface, prefix: string): Promise<string> {
  return new Promise((resolve) => {
    const listener = (line: string) => {
      if (line.startsWith(prefix)) {
        rl.off('line', listener)
        resolve(line)
      }
    }
    rl.on('line', listener)
  })
}

async function runDepth(depth: number, outFile: string) {
  const engine = spawn('pnpm', ['exec', 'node', 'scripts/esbuild-run.mjs', 'tools/uci.ts'], { stdio: ['pipe', 'pipe', 'inherit'] })
  const rl = readline.createInterface({ input: engine.stdout })
  const send = (cmd: string) => engine.stdin.write(cmd + '\n')

  send('uci')
  await waitForLine(rl, 'uciok')
  send('isready')
  await waitForLine(rl, 'readyok')

  const board = new Board()
  const search = new Search()
  const moves: string[] = []
  const pgn: string[] = []

  while (true) {
    send(`position startpos moves ${moves.join(' ')}`)
    send(`go depth ${depth}`)
    const line = await waitForLine(rl, 'bestmove')
    const moveStr = line.split(' ')[1]
    if (!moveStr || moveStr === '(none)') break
    const move = parseUciMove(board, moveStr)
    const prefix = board.side === Color.White ? `${Math.floor((board.halfMoveNumber + 1)/2)}.` : '...'
    pgn.push(prefix + ' ' + notateMove(board, move))
    board.executeMove(move)
    moves.push(moveStr)
    const result = search.evaluateDepth0(new EvalNode(board))
    if (result.move === null) break
  }
  const result = search.evaluateDepth0(new EvalNode(board))
  const final = result.move === null ? (result.score === 0 ? '1/2-1/2' : result.score > 0 ? '1-0' : '0-1') : '*'
  mkdirSync(path.dirname(outFile), { recursive: true })
  writeFileSync(outFile, pgn.join(' ') + ' ' + final)
  send('quit')
  await new Promise((res) => engine.on('exit', res))
}

async function main() {
  for (const depth of [1,2,3]) {
    await runDepth(depth, `pgn/depth-${depth}.pgn`)
  }
}

main()
