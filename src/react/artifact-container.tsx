import { useState } from "react"
import type { UiArtifactMetadataValue, UiArtifactPart } from "../model/types"
import { ArtifactBody, getDefaultArtifactView } from "./artifact-body"

export type ArtifactContainerProps = {
  part: UiArtifactPart
}

function formatMetadataValue(value: UiArtifactMetadataValue) {
  return value === null ? "null" : String(value)
}

function getInitialSelection(part: UiArtifactPart) {
  return {
    artifact: part.artifact,
    viewId: getDefaultArtifactView(part.artifact)?.id,
  }
}

export function ArtifactContainer({ part }: ArtifactContainerProps) {
  const { artifact } = part
  const defaultView = getDefaultArtifactView(artifact)
  const [selection, setSelection] = useState(() => getInitialSelection(part))
  const activeViewId = selection.artifact === artifact ? selection.viewId : defaultView?.id
  const activeView = artifact.views.find((view) => view.id === activeViewId) ?? defaultView
  const heading = artifact.title ?? artifact.kind
  const metadataEntries = Object.entries(artifact.metadata ?? {})

  return (
    <section data-slot="artifact-container">
      <header data-slot="artifact-header">
        <div>{heading}</div>
        {artifact.views.length > 0 ? (
          <div data-slot="artifact-views">
            {artifact.views.map((view) => (
              <button
                aria-pressed={view.id === activeView?.id}
                key={view.id}
                onClick={() => setSelection({ artifact, viewId: view.id })}
                type="button"
              >
                {view.label}
              </button>
            ))}
          </div>
        ) : null}
      </header>
      {metadataEntries.length > 0 ? (
        <dl data-slot="artifact-metadata">
          {metadataEntries.map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{formatMetadataValue(value)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {activeView ? (
        <div data-slot="artifact-body">
          <ArtifactBody artifact={artifact} part={part} view={activeView} />
        </div>
      ) : null}
    </section>
  )
}
