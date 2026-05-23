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

See the matching example templates in `examples/templates/minimal-app.tsx`, `examples/templates/adapter-template.tsx`, `examples/templates/upload-template.tsx`, and `examples/templates/artifact-template.tsx`.

## Reference-only Surface

The package currently exports more types and React primitives than the initial adoption docs cover. Treat those lower-level renderers, artifact helpers, composer exports, and example adapters as reference material until you have a concrete reason to build past the core runtime plus list flow.

## Docs

- [Getting Started](./docs/getting-started.md)
- [Stream Mapping](./docs/integration/stream-mapping.md)
- [Stability Guide](./docs/advanced/stability.md)
