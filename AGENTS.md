# Repository Guidelines

## Project Structure & Module Organization

Source lives in `src`, split between `src/core` for framework-agnostic overlays, `src/react` for React bindings, and `src/index.ts` which re-exports public entry points. Bundled artifacts land in `dist/` via `tsup` and must never be edited manually. Automation utilities (version bumping, release orchestration) live in `scripts/`. Keep any temporary assets inside `tmp/` and remove them before committing. When adding new modules prefer mirroring the existing hierarchy (core implementation plus a React wrapper) so that downstream consumers get consistent import surfaces (`@remcostoeten/vigilo-core`, `@remcostoeten/vigilo-react`, `@remcostoeten/vigilo-vue`). The core must stay framework-neutral TypeScript/JSX so per-framework layers remain as thin as possible—ideally a single wrapper component or hook per framework.

## Build, Test, and Development Commands

- `bun dev`: runs `tsup --watch` to rebuild on every change and outputs to `dist/`. Use this while iterating locally.
- `bun run build`: produces optimized CJS, ESM, and type bundles through `tsup`. Executed automatically before publishing.
- `bun run typecheck`: executes `tsc --noEmit`, ensuring the exported API stays type-safe.
- `bun run release`: triggers the scripted release flow (version bump + changelog + tag). Only run after tests pass and PRs merge.

## Coding Style & Naming Conventions

This codebase is strictly TypeScript with ES2022 modules. Use 2-space indentation, single quotes, and trailing commas as seen in existing files. Prefer named exports for reusable functions and hooks (`useOverlayState`) and default exports only for React components that map directly to files. Maintain strict separation of concerns: one responsibility per file and avoid cross-layer coupling between `core` and `react`. All filenames, functions, constants, and types should use kebab-case (files) or camelCase/PascalCase with concise two-word maximum identifiers (`overlay-state`, `useOverlayState`, `OverlayProvider`). Use classic declarations (`function foo() {}`) instead of arrow function constants; reserve `const foo = () => {}` only for callbacks, memoization, or React hooks that require lexical scoping. Never use classes; prefer composable functions and hooks. Skip inline code comments; rely on expressive names and JSDoc docstrings for documentation. Rely on `tsup` for formatting module boundaries; no additional linters are configured, so keep imports ordered and avoid unused exports to prevent type-check failures.

## Packaging & Typing Expectations

Vigilo ships as a library package (`dist/index.{js,mjs,d.ts}` plus `dist/react/*`), so treat every exported symbol as public API. Each function or hook must include precise TypeScript signatures and JSDoc docstrings so downstream editors get rich LSP hints (`/** describe params + return */`). Avoid `any`; use discriminated unions for overlay states and generics for component props. Whenever you touch the API surface, regenerate declarations via `bun run build` and verify editors pick up new metadata (e.g., open VS Code and inspect hover info).

## Performance & DX Guarantees

Performance is the top priority: every addition must keep bundle size minimal, avoid new runtime dependencies, and prevent work on the critical path. Favor tree-shakeable pure functions, lazy initialization, and zero-cost abstractions so consumers pay only for features they import. Measure output sizes by inspecting `dist/` after `bun run build`, and reject changes that inflate artifacts without justification. Developer experience must remain frictionless—exposed APIs should have intuitive names, exhaustive typing, and no extra setup code. If a feature risks slowing end users or complicating integration, redesign until it is effectively invisible.

## Testing Guidelines

There is no dedicated unit-test runner yet, so fast feedback comes from type checks and manual verification inside example sandboxes. When adding runtime behavior, create lightweight harnesses under `tmp/` or a dedicated `examples/` directory and document the steps in your PR. Ensure new public APIs include type-level assertions and runtime guards so regressions surface during `bun run typecheck`. Future automated tests should live under `src/**/__tests__` using Vitest to match tsup output expectations.

## Commit & Pull Request Guidelines

Follow Conventional Commits (`feat:`, `fix:`, `chore:`) to stay compatible with the release scripts (see `git log`). Each PR should include: purpose summary, screenshots/GIFs for UI-facing changes, reproduction steps for bug fixes, and references to tracked issues. Confirm that `bun run build` and `bun run typecheck` succeed before requesting review. Avoid mixing refactors with feature work; keep commits narrowly scoped so automated versioning remains accurate.

## Tooling & Documentation

We rely exclusively on the Bun package manager for installs, scripts, and dev workflows. Keep documentation centralized—avoid sprinkling new `.md` guides alongside features and defer any necessary writeups until the planned docs pass.
