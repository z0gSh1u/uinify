# Repository Guide

## Scope
- This repo is a single-package TypeScript library with a docs site in `docs-site/`.
- Treat `dist/` and `examples/dist-example/` as generated output; do not edit them by hand.

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
- Run the examples app locally with `pnpm dev:example`.
- Build the examples app with `pnpm build:example`.

## Build And Test Quirks
- `pnpm build` does two things: bundles with `tsup` and then copies `src/styles.css` to `dist/styles.css` via `scripts/copy-styles.mjs`. If you change styles or CSS exports, verify with `pnpm build`.
- Vitest runs in `jsdom` for the whole repo via `vite.config.ts`, and `src/test/setup.ts` loads `@testing-library/jest-dom/vitest`.
- Many UI tests mock `react-virtuoso`; follow that pattern for `MessageList` tests instead of relying on real virtualization.

## Product Boundaries
- The docs intentionally keep the recommended adoption surface narrow: `createChatRuntime`, `UiStreamEvent`, `createAdapterRunner`, `ChatRoot`, `MessageList`, and the documented styling hooks.
- `examples/adapters/openai-like.ts` is a reference-only mapper example. Do not treat it as a stable compatibility layer or copy its shape into public API decisions.
- Styling stability is documented around `uinify/styles.css` tokens, `data-slot` regions, and `slotClassNames`; prefer those before changing renderer structure.

## Docs Site

- The docs site lives in `docs-site/` and uses Astro + Starlight.
- User-facing docs are in `docs-site/src/content/docs/`.
- Run locally with `pnpm docs:dev`, build with `pnpm docs:build`.
- Do not edit the deleted `docs/` directory; its content has been migrated to `docs-site/src/content/docs/`.

## Docs And Example Coupling
- The examples app in `examples/src/App.tsx` is docs-backed product surface, not throwaway demo code.
- `examples/chat/ChatExample.tsx` is the real OpenAI-compatible chat route. Keep API keys server-side through `examples/server/openai-compatible-chat.ts`.
- `examples/playground/App.tsx` is one route in that app and should stay focused on the retained stream-mapping example.
- If example route labels or paths change, keep `examples/src/App.tsx` and the examples guide in sync.

## Verification Expectations
- Preferred lightweight verification after code changes: `pnpm typecheck && pnpm test`.
- Add `pnpm build` whenever you change package exports, build config, or `src/styles.css`.
