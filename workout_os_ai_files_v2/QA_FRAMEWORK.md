# QA Framework

## Goal
Catch regressions before they reach the user.

## Test Categories
- authentication
- persistence
- routing
- storage upload/download
- AI responses
- theme switching
- mobile responsiveness
- accessibility
- performance
- build correctness

## Bug Fix Loop
1. reproduce
2. identify root cause
3. fix
4. verify
5. check regressions

## Release Checks
- TypeScript passes
- lint passes
- build passes
- no console errors
- data persists after refresh
- no duplicate implementations
