// We need to replace NODE_ENV checks when running `bench`, or else we lose performance.
// But neither ts-node nor tsx support passing `--define` to the esbuild command.
// This script is a drop-in replacement for `esbuild` that runs the compiled output with Node.

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn, execFileSync } from 'child_process'
import os from 'os'

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Parse command line arguments
const allArgs = process.argv.slice(2)

// Filter out the current script path (when invoked through package.json scripts)
const thisScriptName = path.basename(__filename)
let filteredArgs = allArgs.filter((arg) => !arg.includes(thisScriptName))

// Capture any additional runtime args for Node (anything after -- should be passed to the Node script)
let esbuildArgs = filteredArgs
let nodeArgs = []

// Check if there's a -- separator in the args
const separatorIndex = filteredArgs.indexOf('--')
if (separatorIndex !== -1) {
  // Split the args at the separator
  esbuildArgs = filteredArgs.slice(0, separatorIndex)
  // Skip the -- itself
  nodeArgs = filteredArgs.slice(separatorIndex + 1)
}

// Find input files (files that don't start with --)
const inputFiles = esbuildArgs.filter((arg) => !arg.startsWith('-') && !arg.startsWith('--'))
if (inputFiles.length === 0) {
  console.error('Error: No input file specified')
  process.exit(1)
}

if (inputFiles.length > 1) {
  console.warn('Warning: Multiple input files detected. Only the first one will be executed.')
}

// Run a command and return its stdout
function runCommand(command, args) {
  try {
    return execFileSync(command, args, { encoding: 'utf8' })
  } catch (error) {
    console.error(`Error executing ${command}: ${error.message}`)
    if (error.stdout) console.log(`stdout: ${error.stdout}`)
    if (error.stderr) console.error(`stderr: ${error.stderr}`)
    process.exit(1)
  }
}

// Create a temporary directory for output
const tempDir = path.join(os.tmpdir(), `esbuild-run-${Date.now()}`)

;(async () => {
  try {
    // Create temporary directory
    await fs.mkdir(tempDir, { recursive: true })

    // Build the esbuild command with quiet flag
    const fullEsbuildArgs = [
      '--bundle',
      '--minify',
      '--platform=node',
      ...esbuildArgs,
      `--outdir=${tempDir}`,
      '--log-level=error',
    ]

    // Use esbuild
    runCommand('esbuild', fullEsbuildArgs)

    // Get the main input file and determine the output file path
    const inputFile = inputFiles[0]
    const baseName = path.basename(inputFile, path.extname(inputFile))
    const entryPoint = path.join(tempDir, `${baseName}.js`)

    // Verify the output file exists
    try {
      await fs.access(entryPoint, fs.constants.F_OK)
    } catch (e) {
      console.error(`Error: Output file not found: ${entryPoint}`)
      process.exit(1)
    }

    // Run the compiled JavaScript with Node, passing any additional arguments
    const nodeProcess = spawn('node', [entryPoint, ...nodeArgs], {
      stdio: 'inherit',
    })

    // Wait for the Node process to exit
    nodeProcess.on('close', async (code) => {
      // Clean up the temporary directory
      try {
        await fs.rm(tempDir, { recursive: true, force: true })
      } catch (cleanupError) {
        console.warn(`Warning: Failed to clean up temporary directory: ${cleanupError.message}`)
      }

      // Exit with the same code as the Node process
      process.exit(code)
    })
  } catch (error) {
    console.error('Error:', error.message || error)
    // Try to clean up on error
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (e) {
      // Ignore cleanup errors on main error
    }
    process.exit(1)
  }
})()
