import type { LexicalComposerProps, UiComposerAttachment } from "../../../../src/composer/lexical"

export const LIVE_CHAT_IMAGE_MAX_BYTES = 4 * 1024 * 1024

export type LiveChatImageAttachment = UiComposerAttachment & {
  dataUrl: string
}

export function isUploadedImageAttachment(
  attachment: UiComposerAttachment,
): attachment is LiveChatImageAttachment {
  return attachment.status === "uploaded" && typeof (attachment as { dataUrl?: unknown }).dataUrl === "string"
}

export function createImageAttachmentValidator(): NonNullable<LexicalComposerProps["onAttachmentValidation"]> {
  return (attachments) =>
    attachments.map((attachment) => {
      if (!attachment.file.type.startsWith("image/")) {
        return rejectImageAttachment(attachment, "invalid-type", "Only image files can be attached.")
      }

      if (attachment.file.size > LIVE_CHAT_IMAGE_MAX_BYTES) {
        return rejectImageAttachment(attachment, "file-too-large", "Images must be 4 MB or smaller.")
      }

      return { ok: true as const, attachment }
    })
}

function rejectImageAttachment(
  attachment: UiComposerAttachment,
  code: "file-too-large" | "invalid-type",
  message: string,
) {
  return {
    ok: false as const,
    attachment: {
      id: `${attachment.id}-rejected`,
      name: attachment.name,
      mimeType: attachment.mimeType,
      size: attachment.size,
      sourceAttachmentId: attachment.id,
      status: "error" as const,
      rejection: {
        code,
        message,
      },
    },
  }
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.addEventListener("load", () => {
      if (typeof reader.result === "string" && reader.result.startsWith("data:")) {
        resolve(reader.result)
        return
      }

      reject(new Error("Expected FileReader to return a data URL."))
    })
    reader.addEventListener("error", () => {
      reject(reader.error ?? new Error("Failed to read file."))
    })
    reader.addEventListener("abort", () => {
      reject(new Error("File read was aborted."))
    })

    reader.readAsDataURL(file)
  })
}
