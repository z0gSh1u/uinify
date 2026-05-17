import type { ClipboardEvent, DragEvent } from "react"
import type { UiComposerAttachment } from "../../contracts"

let attachmentIdCounter = 0

export function collectAttachments(files: FileList | File[]) {
  return Array.from(files).map<UiComposerAttachment>((file, index) => ({
    id: `${Date.now()}-${attachmentIdCounter++}-${index}-${file.name}`,
    file,
    status: "ready",
  }))
}

export function createAttachmentHandlers(onAdd: (files: UiComposerAttachment[]) => void) {
  return {
    onPaste(event: ClipboardEvent<HTMLElement>) {
      if (event.clipboardData.files.length > 0) {
        event.preventDefault()
        onAdd(collectAttachments(event.clipboardData.files))
      }
    },
    onDrop(event: DragEvent<HTMLElement>) {
      if (event.dataTransfer.files.length > 0) {
        event.preventDefault()
        onAdd(collectAttachments(event.dataTransfer.files))
      }
    },
  }
}
