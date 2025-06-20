/** @jest-environment node */
import { spawn } from 'child_process'
import readline from 'node:readline'

function launch() {
  const proc = spawn('pnpm', ['exec', 'node', 'scripts/esbuild-run.mjs', 'tools/uci.ts'], { stdio: ['pipe', 'pipe', 'pipe'] })
  const rl = readline.createInterface({ input: proc.stdout })
  return { proc, rl }
}

function waitFor(rl: readline.Interface, predicate: (line: string) => boolean): Promise<string> {
  return new Promise((resolve) => {
    const listener = (line: string) => {
      if (predicate(line)) {
        rl.off('line', listener)
        resolve(line)
      }
    }
    rl.on('line', listener)
  })
}

describe('uci engine', () => {
  test('handshake', async () => {
    const { proc, rl } = launch()
    proc.stdin.write('uci\n')
    await waitFor(rl, (l) => l === 'uciok')
    proc.stdin.write('isready\n')
    await waitFor(rl, (l) => l === 'readyok')
    proc.stdin.write('quit\n')
    await new Promise((res) => proc.on('exit', res))
  })

  test('bestmove generation', async () => {
    const { proc, rl } = launch()
    proc.stdin.write('uci\n')
    await waitFor(rl, (l) => l === 'uciok')
    proc.stdin.write('isready\n')
    await waitFor(rl, (l) => l === 'readyok')
    proc.stdin.write('position startpos\n')
    proc.stdin.write('go depth 1\n')
    const line = await waitFor(rl, (l) => l.startsWith('bestmove'))
    const move = line.split(' ')[1]
    expect(move.length).toBeGreaterThanOrEqual(4)
    proc.stdin.write('quit\n')
    await new Promise((res) => proc.on('exit', res))
  })
})
