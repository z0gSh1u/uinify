import type { UiComposerAttachment } from "../composer/contracts"
import { useSlotClassNames } from "./chat-root"

export type AttachmentTrayProps = {
  attachments: UiComposerAttachment[]
  onRemove?: (id: string) => void
  onRetry?: (attachment: UiComposerAttachment) => void
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
          <span>{attachment.name}</span>
          {attachment.progress !== undefined ? <span>{String(attachment.progress)}</span> : null}
          {attachment.error ? <span>{attachment.error}</span> : null}
          {attachment.status === "error" && onRetry ? (
            <button onClick={() => onRetry(attachment)} type="button">
              Retry
            </button>
          ) : null}
          {onRemove ? (
            <button onClick={() => onRemove(attachment.id)} type="button">
              Remove
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}
