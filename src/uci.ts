/**
 * UCI (Universal Chess Interface)
 *
 * Run: `pnpm run --silent uci`
 */

import * as readline from 'node:readline'

/**
 * Start the UCI input/output loop
 */
export function startUciLoop(): void {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  console.log('Echo started, press Ctrl+C to terminate.')

  // Set up event listener for each line of input
  rl.on('line', (line) => {
    // Simply echo the line back
    console.log(`Received: ${line}`)
  })

  // Handle closing
  rl.on('close', () => {
    console.log('Echo terminated.')
    process.exit(0)
  })
}

// Start the UCI loop if this file is run directly
if (require.main === module) {
  startUciLoop()
}
