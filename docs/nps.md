# Nodes Per Second (NPS)

## Overview

Nodes Per Second (NPS) measures how many positions we evaluate per second.

A node is counted when a position is actually evaluated (not retrieved from the TT).
@TampliteSK calculates it like this so we do too.

## Implementation notes

Look for `this.nodesEvaluated++` in the code.
