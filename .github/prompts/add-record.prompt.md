---
description: 'Add a record to the leaderboard'
---

## Adding a User Record to Challenge Leaderboard

Use this prompt to add a new user record to a challenge leaderboard:

```
Add [USERNAME] to the "[CHALLENGE_NAME]" challenge leaderboard with:
- Depth: [DEPTH]
- Moves: [MOVES]
- Date: [DATE, leave blank for today]
- Note: [OPTIONAL_NOTE]
```

### Example:

```
Add erix to the "Capture Is Forced" challenge leaderboard with:
- Depth: 3
- Moves: 32
```

## Adding a New User

If the user doesn't exist yet, use this prompt to add the user first:

```
Add new user [USERNAME] with:
- Display name: [DISPLAY_NAME]
- Notes: [NOTES_ABOUT_USER]
```

### Example:

```
Add new user Erix with:
- Display name: Erix
- Notes: @erix_senpai, CNC Discord
```

## Finding a Challenge

If you're not sure which file contains the challenge, use this prompt:

```
Find the challenge named "[CHALLENGE_NAME]" in the codebase
```

### Example:

```
Find the challenge named "Capture Is Forced" in the codebase
```

## Adding Multiple Records at Once

For adding multiple records for the same user:

```
Add these records for [USERNAME]:
1. "[CHALLENGE_NAME_1]" - depth [DEPTH], [MOVES] moves
2. "[CHALLENGE_NAME_2]" - depth [DEPTH], [MOVES] moves, note: [OPTIONAL_NOTE]
```

### Example:

```
Add these records for erix:
1. "Capture Is Forced" - depth 3, 32 moves
2. "Our Kings Almost Touched" - depth 3, 39 moves
```

## Workflow for Adding Records

1. Add the user if they don't exist yet
2. Find the challenge(s) if you don't know which file contains them
3. Add the record(s) to the appropriate challenge file(s)
