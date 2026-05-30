import type { ClipboardEvent, DragEvent } from "react"
import type {
  UiComposerAttachment,
  UiComposerAttachmentValidationResult,
} from "../../contracts"

let attachmentIdCounter = 0

export function collectAttachments(files: FileList | File[]) {
  return Array.from(files).map<UiComposerAttachment>((file, index) => {
    const name = readAttachmentName(file)

    return {
      id: `${Date.now()}-${attachmentIdCounter++}-${index}-${name}`,
      file,
      name,
      mimeType: file.type,
      size: file.size,
      status: "queued",
    }
  })
}

function readAttachmentName(file: File) {
  if (file.name) {
    return file.name
  }

  const extension = readFallbackExtension(file.type)

  if (!file.type.startsWith("image/")) {
    return extension ? `pasted-file.${extension}` : "pasted-file"
  }

  return `pasted-image.${extension ?? "image"}`
}

function readFallbackExtension(mimeType: string) {
  const subtype = mimeType.split("/")[1]?.split(";")[0]

  if (!subtype) {
    return undefined
  }

  return subtype === "plain" ? "txt" : subtype
}

export function createAttachmentHandlers(
  onAdd: (files: UiComposerAttachment[]) => void,
  onValidate?: (attachments: UiComposerAttachment[]) => UiComposerAttachmentValidationResult[],
) {
  const addAttachments = (files: FileList | File[]) => {
    const attachments = collectAttachments(files)

    if (!onValidate) {
      onAdd(attachments)
      return
    }

    onAdd(resolveValidatedAttachments(attachments, onValidate(attachments)))
  }

  return {
    onPaste(event: ClipboardEvent<HTMLElement>) {
      if (event.clipboardData.files.length > 0) {
        event.preventDefault()
        addAttachments(event.clipboardData.files)
      }
    },
    onDrop(event: DragEvent<HTMLElement>) {
      if (event.dataTransfer.files.length > 0) {
        event.preventDefault()
        addAttachments(event.dataTransfer.files)
      }
    },
  }
}

function resolveValidatedAttachments(
  attachments: UiComposerAttachment[],
  results: UiComposerAttachmentValidationResult[],
) {
  return results.map((result, index) => {
    if (result?.ok) {
      return result.attachment
    }

    const sourceAttachment =
      attachments.find((attachment) => attachment.id === result?.attachment.sourceAttachmentId) ??
      attachments[index]

    return {
      ...sourceAttachment,
      ...result?.attachment,
      error: result?.attachment.rejection.message,
      file: sourceAttachment?.file,
    }
  })
}
