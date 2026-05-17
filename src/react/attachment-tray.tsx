import type { UiComposerAttachment } from "../composer/contracts"

export type AttachmentTrayProps = {
  attachments: UiComposerAttachment[]
  onRemove?: (id: string) => void
}

export function AttachmentTray({ attachments, onRemove }: AttachmentTrayProps) {
  return (
    <div data-has-attachments={attachments.length > 0} data-slot="attachment-tray">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          data-slot="attachment-item"
          data-state={attachment.status}
        >
          <span>{attachment.file.name}</span>
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
