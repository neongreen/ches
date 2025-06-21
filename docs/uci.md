# UCI Interface

This project ships with a simple [UCI](https://www.chessprogramming.org/UCI) (Universal Chess Interface) implementation. It exposes the engine so that any UCI compatible GUI can run it or you can script it directly.

## Running the engine

The entry point lives at `tools/uci.ts`. You can start the engine with Node.js:

```bash
pnpm exec node scripts/esbuild-run.mjs tools/uci.ts
```

The engine will listen for commands on `stdin` and reply on `stdout`.

## Self‑play runner

A small helper script, `tools/uci-runner.ts`, demonstrates driving the engine through UCI. It plays the engine against itself at search depths 1–3 and writes the resulting games to the `pgn/` directory.

Run it with:

```bash
pnpm exec node scripts/esbuild-run.mjs tools/uci-runner.ts
```

This will create/update `pgn/depth-1.pgn`, `pgn/depth-2.pgn` and `pgn/depth-3.pgn`.

