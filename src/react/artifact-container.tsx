import { useState } from "react"
import type { UiArtifactMetadataValue, UiArtifactPart } from "../model/types"
import { getArtifactViewPayload } from "./actions"
import { ArtifactBody, getDefaultArtifactView } from "./artifact-body"
import { useCurrentMessage } from "./current-message"
import { useChatActionHandlers } from "./chat-root"
import { useRenderers } from "./renderers"

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
  const message = useCurrentMessage()
  const { onPartAction } = useChatActionHandlers()
  const renderers = useRenderers()
  const defaultView = getDefaultArtifactView(artifact)
  const [selection, setSelection] = useState(() => getInitialSelection(part))
  const activeViewId = selection.artifact === artifact ? selection.viewId : defaultView?.id
  const activeView = artifact.views.find((view) => view.id === activeViewId) ?? defaultView
  const heading = artifact.title ?? `${artifact.kind} artifact`
  const metadataEntries = Object.entries(artifact.metadata ?? {})
  const isEmptyView = activeView !== undefined && typeof activeView.value === "string" && activeView.value.length === 0
  const hasCustomRenderer =
    renderers.artifactRegistry?.[artifact.kind] !== undefined || renderers.renderArtifactFallback !== undefined
  const showEmptyViewMessage = isEmptyView && !hasCustomRenderer

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
                onClick={() => {
                  if (view.id === activeView?.id) {
                    return
                  }

                  setSelection({ artifact, viewId: view.id })
                  if (message) {
                    onPartAction?.({
                      ...getArtifactViewPayload(part, view.id),
                      messageId: message.id,
                      partKind: "artifact",
                    })
                  }
                }}
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
      ) : (
        <div data-slot="artifact-empty">No artifact metadata.</div>
      )}
      {!activeView ? (
        <div data-slot="artifact-empty">No artifact views are available.</div>
      ) : showEmptyViewMessage ? (
        <div data-slot="artifact-empty">This artifact view is empty.</div>
      ) : null}
      {activeView && !showEmptyViewMessage ? (
        <div data-slot="artifact-body">
          <ArtifactBody artifact={artifact} part={part} view={activeView} />
        </div>
      ) : null}
    </section>
  )
}
