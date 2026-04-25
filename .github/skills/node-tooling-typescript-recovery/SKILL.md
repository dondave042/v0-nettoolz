---
name: node-tooling-typescript-recovery
description: 'Install Node.js tooling (npm/pnpm), install workspace dependencies, restart TypeScript server, and verify diagnostics are clean. Use for missing react/jsx-runtime/module resolution errors in VS Code.'
argument-hint: 'Provide project path and whether to use pnpm or npm fallback'
---

# Node Tooling + TypeScript Recovery

## What It Produces

This skill restores a broken JavaScript/TypeScript workspace where dependencies are missing or TypeScript language service is stale.

It outputs:
- Installed Node.js tooling (`node`, `npm`, `pnpm`)
- Installed project dependencies in the repository root
- Restarted TypeScript server state
- Verified diagnostics status for target files

## When to Use

- VS Code shows `Cannot find module 'react'` or `react/jsx-runtime`
- JSX files show `JSX.IntrinsicElements` missing errors
- Project has lockfile but dependencies are not installed
- Language server appears stuck after dependency changes

## Procedure

1. Detect current tooling
- Check availability of `node`, `npm`, `pnpm`, and `winget`
- Record versions when present

2. Install Node.js if missing
- Prefer `winget install OpenJS.NodeJS.LTS`
- Verify with `node -v` and `npm -v`

3. Ensure `pnpm` availability
- Try `corepack` first
- If permission/policy blocks `corepack`, install user-scoped `pnpm` via `npm` prefix

4. Install workspace dependencies
- Change into the project root
- Run `pnpm install` when lockfile indicates pnpm
- Fallback to `npm install` when pnpm is unavailable

5. Restart TypeScript language service
- Restart VS Code TypeScript server
- CLI fallback: terminate `tsserver` processes so VS Code respawns them

6. Validate results
- Re-run diagnostics for affected files
- Confirm module-resolution and JSX errors are cleared

## Decision Branches

- If package manager commands are blocked by PowerShell policy:
  Use `.cmd` shims (`npm.cmd`, `pnpm.cmd`, `corepack.cmd`).
- If global install requires admin rights:
  Use user-scoped installation paths.
- If diagnostics persist after install:
  Reconfirm project root, rerun install, then restart TypeScript server again.

## Quality Checks

- `node -v` returns a version
- Selected package manager returns a version
- `node_modules` exists in project root
- Target file diagnostics show no module-resolution JSX runtime errors

## Example Prompts

- "Fix missing react/jsx-runtime errors in this Next.js project and refresh TypeScript service"
- "Install Node + pnpm on Windows and run dependency install for this repo"
- "Recover TypeScript after cloning: install deps and clear module not found errors"
- "Set up package tooling for this workspace and verify TS diagnostics"
