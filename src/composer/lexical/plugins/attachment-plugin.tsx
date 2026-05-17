import type { ClipboardEvent, DragEvent } from "react"
import type { UiComposerAttachment } from "../../contracts"

export function collectAttachments(files: FileList | File[]) {
  return Array.from(files).map<UiComposerAttachment>((file, index) => ({
    id: `${file.name}-${index}`,
    file,
    status: "ready",
  }))
}

export function createAttachmentHandlers(onAdd: (files: UiComposerAttachment[]) => void) {
  return {
    onPaste(event: ClipboardEvent<HTMLElement>) {
      if (event.clipboardData.files.length > 0) {
        onAdd(collectAttachments(event.clipboardData.files))
      }
    },
    onDrop(event: DragEvent<HTMLElement>) {
      event.preventDefault()

      if (event.dataTransfer.files.length > 0) {
        onAdd(collectAttachments(event.dataTransfer.files))
      }
    },
  }
}
