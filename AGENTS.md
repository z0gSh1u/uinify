# Repository Guide

## Scope
- This repo is a single-package TypeScript library, not a monorepo.
- Treat `dist/` and `examples/playground/dist-example/` as generated output; do not edit them by hand.

## Primary Entry Points
- `src/index.ts` is the package root (`uinify`) for core model types, runtime APIs, and adapter helpers.
- `src/react/index.ts` is the React surface (`uinify/react`).
- `src/sse/index.ts` is the SSE subpath (`uinify/sse`).
- `src/composer/lexical/index.ts` is the composer subpath (`uinify/composer/lexical`).
- If you add or remove a public subpath or entry file, keep `package.json` `exports` and `tsup.config.ts` `entry` in sync.

## Verified Commands
- Install with `pnpm install`.
- Run the full test suite with `pnpm test`.
- Run a focused test file with `pnpm test -- src/runtime/create-chat-runtime.test.ts`.
- Run type checks with `pnpm typecheck`.
- Build the package with `pnpm build`.
- Run the example playground locally with `pnpm dev:example`.
- Build the example playground with `pnpm build:example`.

## Build And Test Quirks
- `pnpm build` does two things: bundles with `tsup` and then copies `src/styles.css` to `dist/styles.css` via `scripts/copy-styles.mjs`. If you change styles or CSS exports, verify with `pnpm build`.
- Vitest runs in `jsdom` for the whole repo via `vite.config.ts`, and `src/test/setup.ts` loads `@testing-library/jest-dom/vitest`.
- Many UI tests mock `react-virtuoso`; follow that pattern for `MessageList` and example-playground tests instead of relying on real virtualization.

## Product Boundaries
- The docs intentionally keep the recommended adoption surface narrow: `createChatRuntime`, `UiStreamEvent`, `createAdapterRunner`, `ChatRoot`, `MessageList`, and the documented styling hooks.
- `examples/adapters/*` are reference-only examples. Do not treat them as stable compatibility layers or copy their shapes into public API decisions.
- Styling stability is documented around `uinify/styles.css` tokens, `data-slot` regions, and `slotClassNames`; prefer those before changing renderer structure.

## Docs And Example Coupling
- The example playground in `examples/playground/App.tsx` is docs-backed product surface, not throwaway demo code.
- Template metadata lives in `examples/fixtures/index.ts`; if you rename docs paths, section titles, or template labels, update that file and the tests that assert those exact strings.
- The strongest regression checks for docs/example alignment are `examples/tests/example-flows.test.tsx` and `examples/tests/templates.test.tsx`.

## Verification Expectations
- Preferred lightweight verification after code changes: `pnpm typecheck && pnpm test`.
- Add `pnpm build` whenever you change package exports, build config, or `src/styles.css`.
