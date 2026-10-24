# AGENTS.md

## Repository state

This repo is currently a scaffold, not a working app. Do not infer a stack, package manager, or command.

- `bujhi-nai-frontend/` and `bujhi-nai-backend/` exist but are empty.
- There are no manifests, lockfiles, source files, CI, tests, or commits yet (branch `master`, no remote).
- `.gitignore` exists but is empty.

## Working here

- Before running install/build/test/lint, confirm the toolchain from files on disk. If no manifest exists, ask the user instead of guessing `npm`/`pip` commands or scaffolding a project.
- When adding code, keep the frontend in `bujhi-nai-frontend/` and the backend in `bujhi-nai-backend/`; put each manifest and lockfile inside its own directory.
- Update this file with the exact install, dev, build, test, and single-test commands once they exist. Add stack-appropriate patterns to `.gitignore` in the same change that introduces generated files (e.g. `node_modules/`, build output, `.env`).
