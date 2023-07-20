# Ches

A small little game I'm making

## Dev

### For absolute beginners

You need to set up VSCode and Node.js:

* VSCode: https://code.visualstudio.com/
* Node.js: https://nodejs.org/en/

Once you install both, open a new Terminal and do:

```bash
corepack enable    # On Windows, has to be done from a "Run as Administrator" Terminal
git clone https://github.com/neongreen/chess.git
cd chess
```

Proceed with the next section.

### Start

```bash
yarn  # might be needed
yarn dev
```

### Debug

`chess` and `gameMethods` are available in the browser console. Just type it. You'll be pleasantly surprised.

To test `unmakeMove`, run:

```bash
NODE_ENV=test yarn bench
NODE_ENV=test yarn golden-games -s unrestricted
```

### Typecheck and lint

```bash
yarn check
```

### Generating sample (golden) games

Useful to check that a refactoring didn't change anything (the engine is deterministic right now).

```bash
# Needs to be run from the root!

yarn golden-games    # regenerate all

yarn golden-games -s <uuid1> -s <uuid2> ... # regenerate specific challenges
```

### Can't push huge Git objects

```bash
git config --global http.postBuffer 524288000
```

### Upgrading Yarn

```bash
yarn set version latest
```

### Upgrading TypeScript

```bash
yarn add -D typescript
yarn dlx @yarnpkg/sdks vscode
```

Then "Select TypeScript version" in VSCode.