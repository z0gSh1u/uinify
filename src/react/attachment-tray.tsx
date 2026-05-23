import type { UiComposerAttachment } from "../composer/contracts"
import { useSlotClassNames } from "./chat-root"

export type AttachmentTrayProps = {
  attachments: UiComposerAttachment[]
  onRemove?: (id: string) => void
  onRetry?: (attachment: UiComposerAttachment) => void
}

function getStageLabel(attachment: UiComposerAttachment) {
  if (attachment.rejection) {
    return "Rejected"
  }

  switch (attachment.status) {
    case "queued":
      return "Queued"
    case "uploading":
      return "Uploading"
    case "uploaded":
      return "Uploaded"
    case "error":
      return "Upload failed"
    default:
      return null
  }
}

function getBlockedReason(attachment: UiComposerAttachment) {
  if (attachment.rejection?.message) {
    return attachment.rejection.message
  }

  return attachment.error
}

export function AttachmentTray({ attachments, onRemove, onRetry }: AttachmentTrayProps) {
  const slotClassNames = useSlotClassNames()
  const visibleAttachments = attachments.filter((attachment) => attachment.status !== "removed")

  return (
    <div data-has-attachments={visibleAttachments.length > 0} data-slot="attachment-tray">
      {visibleAttachments.map((attachment) => (
        <div
          className={slotClassNames.attachmentItem}
          key={attachment.id}
          data-slot="attachment-item"
          data-state={attachment.status}
        >
          {(() => {
            const stageLabel = getStageLabel(attachment)
            const blockedReason = getBlockedReason(attachment)

            return (
              <>
          <span>{attachment.name}</span>
          {stageLabel ? <span>{stageLabel}</span> : null}
          {attachment.progress !== undefined ? <span>{attachment.progress}% uploaded</span> : null}
          {blockedReason && blockedReason !== stageLabel ? <span>{blockedReason}</span> : null}
          {attachment.rejection ? <span>This file was rejected before upload.</span> : null}
          {attachment.status === "error" && onRetry ? (
            <button onClick={() => onRetry(attachment)} type="button">
              Retry upload
            </button>
          ) : null}
          {onRemove ? (
            <button onClick={() => onRemove(attachment.id)} type="button">
              Remove attachment
            </button>
          ) : null}
              </>
            )
          })()}
        </div>
      ))}
    </div>
  )
}
