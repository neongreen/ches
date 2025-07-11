#!/usr/bin/env bash

# See docs/uci.md

cd "$(dirname "$0")/.." || exit 1

script -F -q uci.log "$SHELL" -ilc "pnpm run uci"
