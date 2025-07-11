# UCI Interface

This project ships with a simple [UCI](https://www.chessprogramming.org/UCI) (Universal Chess Interface) implementation.
It exposes the engine so that any UCI compatible GUI can run it.

## Running the engine

The entry point lives at `tools/uci.ts`. To start the engine:

```bash
mise uci
```

If your GUI wants a single binary, you can provide the path to [scripts/uci.sh](../scripts/uci.sh) instead.
You still need pnpm installed and available in your login shell.

## Building the engine

To build the engine, check the `mise uci:build:*` tasks.
