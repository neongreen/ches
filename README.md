# Ches

A small little game I'm making.
You can play at <https://ches.vercel.app>.

## Dev

### For absolute beginners

You need to set up these:

* VSCode: https://code.visualstudio.com/
* Node.js: https://nodejs.org/en/
* pnpm: https://pnpm.io/installation

Then open a new Terminal and do:

```bash
git clone https://github.com/neongreen/ches.git
cd ches
```

Proceed with the next section.

### Start

```bash
pnpm i
pnpm dev
```

### Debug

`chess` and `gameMethods` are available in the browser console. Just type it. You'll be pleasantly surprised.

To test `unmakeMove`, run:

```bash
pnpm bench:test
pnpm golden:test -s unrestricted
```

### Typecheck and lint

```bash
pnpm check
```

### Generating sample (golden) games

Useful to check that a refactoring didn't change anything (the engine is deterministic right now).

```bash
# Needs to be run from the root!

pnpm golden    # regenerate all

pnpm golden -s <uuid1> -s <uuid2> ... # regenerate specific challenges
```

### UCI interface

```bash
pnpm run --silent uci
```

Or with Mise:

```bash
mise run uci
```

### Can't push huge Git objects

```bash
git config --global http.postBuffer 524288000
```

### React typecheck errors

```
Type 'import(".../@types-react-npm-18.0.26-d708995a34-10c0.zip/node_modules/@types/react/index").ReactNode' is not assignable to type 'React.ReactNode'.
```

Might be caused by having several react versions
