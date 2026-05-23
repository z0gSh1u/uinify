# Stability Guide

This page separates the surfaces intended for adoption from the surfaces that are useful for learning from the current implementation.

## Recommended Surface

Prefer building integrations on the narrowest stable surface:

- Core runtime entry points such as `createChatRuntime` and canonical `UiStreamEvent` mapping.
- `createAdapterRunner` from the package root as the default stable adapter entry point.
- Basic React rendering entry points such as `ChatRoot`, `MessageList`, `Message`, and `MessagePart`.
- The documented extension seams in this docs set, including controlled `LexicalComposer` attachments and React renderer overrides through `RenderersProvider`.
- Shared model contracts that those surfaces consume directly, such as message parts, artifacts, and attachment state values.

This is the recommended surface because it matches the public exports and the docs-backed integration patterns.

`createAdapterResult` and `validateAdapterEvents` are part of the public package root, but they are lower-level helpers for custom adapter wrappers rather than the default adoption path.

## Stable Styling Hooks

For styling and theming, prefer the documented hooks in this order:

- CSS custom properties under the `--uinify-*` namespace in `uinify/styles.css`
- Stable `data-slot` regions such as `message`, `message-parts`, `message-actions`, `part-actions`, `artifact-container`, `artifact-tabs`, `artifact-views`, `attachment-tray`, `attachment-actions`, and `attachment-part`
- `slotClassNames` keys that map directly to those documented stable regions

Prefer tokens first, then stable slots and `slotClassNames`, and replace renderers only when the default structure is the wrong product shape rather than merely the wrong visual treatment.

## Reference-only Surface

Some code in the repository is intentionally useful as a reference, but it should not be treated as a stable integration contract.

- Files under `examples/adapters/` are reference-only examples.
- Example adapters such as `custom-minimal`, `agent-like`, and `openai-like` show how to use the stable adapter helpers, not supported compatibility layers by themselves.
- Internal implementation details behind the current renderer shells and examples may evolve as the package adds more official docs and extension points.

Use the reference-only surface to understand patterns, naming, and trade-offs. Do not couple production integrations to those files as if they were versioned APIs.
