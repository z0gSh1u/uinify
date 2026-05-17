# Artifact Renderers

Artifacts are message parts with a typed container shape and one or more renderable `views`. The current model is `UiArtifactPart`, which wraps a `UiArtifact` with:

- `kind`: host-defined artifact category such as `code`, `image`, or another domain-specific key.
- `title` and `metadata`: optional display metadata.
- `defaultViewId`: optional preferred initial view.
- `views`: the actual render targets for the artifact.

Each entry in `views` is a `UiArtifactView` with an `id`, `label`, `kind`, optional `language`, and a `value`. The built-in container renders view switch buttons, picks `defaultViewId` when present, and falls back to the first view otherwise.

## Registry Override Pattern

The React renderer surface exposes artifact customization through `RenderersProvider`.

- `artifactRegistry` maps `artifact.kind` to a custom renderer.
- `renderArtifactFallback` handles artifact kinds that do not have a keyed registry entry.

Resolution order is:

1. Look up the artifact kind in `artifactRegistry`.
2. If no keyed renderer exists, call `renderArtifactFallback` when provided.
3. If neither override exists, use the default artifact body renderer.

That pattern lets you keep the built-in `ArtifactContainer` shell and view switching while replacing only the body rendering for specific artifact kinds.

## Example

```tsx
import {
  ArtifactContainer,
  RenderersProvider,
  type ArtifactRendererProps,
} from "uinify/react"
import type { UiArtifactPart } from "uinify"

function CodeArtifactRenderer({ artifact, view }: ArtifactRendererProps) {
  return (
    <section>
      <h3>{artifact.title ?? "Code artifact"}</h3>
      <pre>
        <code>{typeof view.value === "string" ? view.value : JSON.stringify(view.value, null, 2)}</code>
      </pre>
    </section>
  )
}

function UnknownArtifactRenderer({ artifact, view }: ArtifactRendererProps) {
  return (
    <pre>
      {artifact.kind}: {typeof view.value === "string" ? view.value : JSON.stringify(view.value, null, 2)}
    </pre>
  )
}

export function ArtifactExample({ part }: { part: UiArtifactPart }) {
  return (
    <RenderersProvider
      value={{
        artifactRegistry: {
          code: CodeArtifactRenderer,
        },
        renderArtifactFallback: UnknownArtifactRenderer,
      }}
    >
      <ArtifactContainer part={part} />
    </RenderersProvider>
  )
}
```

Use `artifactRegistry` when you have a stable renderer for a known `kind`. Use `renderArtifactFallback` when you want a catch-all path for host-defined artifacts that do not merit their own keyed renderer yet.
