# uinify

`uinify` is a small chat UI foundation for consumers who want to keep backend protocol handling outside the UI layer. You map host or backend events into `UiStreamEvent`, or wrap that mapper with the stable adapter helpers, dispatch them into a runtime, and render the conversation with React.

## Install

```bash
npm install uinify react react-dom
```

## Stable Surface

For early adoption, start with this narrow recommended surface:

- `createChatRuntime` from `uinify`
- `UiStreamEvent` from `uinify`
- `createAdapterRunner` from `uinify` when your mapper needs a stable shared contract with diagnostics
- `ChatRoot` from `uinify/react`
- `MessageList` from `uinify/react`

These are the pieces used by the getting-started and stream-mapping guides.

`createAdapterResult` and `validateAdapterEvents` are also exported from `uinify` as lower-level adapter helpers when you need to build your own wrapper around that contract.

For first-time adoption, the recommended default setup is to import `uinify/styles.css` once near your app entrypoint.

Stable styling hooks are available through documented `data-slot` regions, `slotClassNames`, and the `--uinify-*` tokens in `uinify/styles.css`.

The examples app is intentionally narrow. Its `/chat` route runs a real OpenAI-compatible text chat through a local Vite API proxy, and `/playground` demonstrates the retained OpenAI-like reference mapper in `examples/adapters/openai-like.ts`. Run it with `pnpm dev:example`.

## Reference-only Surface

The package currently exports more types and React primitives than the initial adoption docs cover. Treat lower-level renderers, artifact helpers, composer exports, and reference mapper code as reference material until you have a concrete reason to build past the core runtime plus list flow.

## Docs

Documentation is available at [uinify docs](https://z0gsh1u.github.io/uinify/).

To run the docs site locally:

```bash
pnpm docs:dev
```
