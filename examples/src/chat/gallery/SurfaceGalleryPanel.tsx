import { useMemo, useState } from "react"
import {
  ChatRoot,
  MessageList,
  type MessageActionPayload,
  type PartActionPayload,
  type SlotClassNames,
} from "../../../../src/react"
import {
  createSurfaceGalleryRuntime,
  SURFACE_GALLERY_ARTIFACT,
} from "./gallery-messages"
import { galleryRenderers } from "./gallery-renderers"
import "../chat.css"

const gallerySlotClassNames: SlotClassNames = {
  message: "surface-gallery-message",
  messageParts: "surface-gallery-message-parts",
  messageActions: "surface-gallery-message-actions",
  partActions: "surface-gallery-part-actions",
  artifactContainer: "surface-gallery-artifact",
  artifactTabs: "surface-gallery-artifact-tabs",
  step: "surface-gallery-step",
  image: "surface-gallery-image-frame",
}

function describeMessageAction(payload: MessageActionPayload) {
  return `${payload.action} message on ${payload.messageId}`
}

function describePartAction(payload: PartActionPayload) {
  if (payload.action === "open-artifact-view") {
    const view = SURFACE_GALLERY_ARTIFACT.views.find((item) => item.id === payload.viewId)
    const viewLabel = view?.label ?? payload.viewId
    const artifactLabel = SURFACE_GALLERY_ARTIFACT.title ?? payload.artifactId

    return `opened ${viewLabel} view for ${artifactLabel}`
  }

  return `${payload.action} ${payload.partKind} part on ${payload.messageId}`
}

export function SurfaceGalleryPanel() {
  const [latestAction, setLatestAction] = useState("none")
  const runtime = useMemo(() => createSurfaceGalleryRuntime(), [])

  return (
    <section
      aria-labelledby="surface-gallery-heading"
      className="surface-gallery-panel"
      data-testid="surface-gallery-panel"
    >
      <header className="chat-header">
        <div>
          <p>Deterministic fixture</p>
          <h2 id="surface-gallery-heading">UI surface gallery</h2>
        </div>
        <span>Static</span>
      </header>

      <div className="chat-transcript" data-testid="surface-gallery-transcript">
        <ChatRoot
          onMessageAction={(payload) => setLatestAction(describeMessageAction(payload))}
          onPartAction={(payload) => setLatestAction(describePartAction(payload))}
          renderers={galleryRenderers}
          runtime={runtime}
          slotClassNames={gallerySlotClassNames}
        >
          <MessageList style={{ height: "100%", minHeight: "100%" }} />
        </ChatRoot>
      </div>

      <section aria-label="Gallery action log" className="surface-gallery-action-log">
        <h3>Action log</h3>
        <p aria-live="polite" role="status">
          Latest action: {latestAction}
        </p>
      </section>
    </section>
  )
}
