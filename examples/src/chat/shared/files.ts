import type { LexicalComposerProps, UiComposerAttachment } from "../../../../src/composer/lexical"

export const LIVE_CHAT_IMAGE_MAX_BYTES = 4 * 1024 * 1024

export type LiveChatImageAttachment = UiComposerAttachment & {
  status: "uploaded"
  dataUrl: string
}

const IMAGE_DATA_URL_PATTERN = /^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/]*={0,2}$/i

export function isUploadedImageAttachment(
  attachment: UiComposerAttachment,
): attachment is LiveChatImageAttachment {
  const dataUrl = (attachment as { dataUrl?: unknown }).dataUrl

  return (
    attachment.status === "uploaded" &&
    isImageAttachment(attachment) &&
    typeof dataUrl === "string" &&
    IMAGE_DATA_URL_PATTERN.test(dataUrl)
  )
}

function isImageAttachment(attachment: UiComposerAttachment) {
  return attachment.mimeType?.startsWith("image/") === true || attachment.file.type.startsWith("image/")
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
