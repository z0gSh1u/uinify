# Stability Guide

This page separates the surfaces intended for adoption from the surfaces that are useful for learning from the current implementation.

## Recommended Surface

Prefer building integrations on the narrowest stable surface:

- Core runtime entry points such as `createChatRuntime` and canonical `UiStreamEvent` mapping.
- Basic React rendering entry points such as `ChatRoot`, `MessageList`, `Message`, and `MessagePart`.
- The documented extension seams in this docs set, including controlled `LexicalComposer` attachments and React renderer overrides through `RenderersProvider`.
- Shared model contracts that those surfaces consume directly, such as message parts, artifacts, and attachment state values.

This is the recommended surface because it matches the public exports and the docs-backed integration patterns.

## Reference-only Surface

Some code in the repository is intentionally useful as a reference, but it should not be treated as a stable integration contract.

- Files under `examples/adapters/` are reference-only examples.
- Example adapters such as `custom-minimal`, `agent-like`, and `openai-like` show mapping patterns, not supported compatibility layers.
- Internal implementation details behind the current renderer shells and examples may evolve as the package adds more official docs and extension points.

Use the reference-only surface to understand patterns, naming, and trade-offs. Do not couple production integrations to those files as if they were versioned APIs.
