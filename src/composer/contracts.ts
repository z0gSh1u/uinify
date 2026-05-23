import type { UiAttachment, UiAttachmentRejection } from "../model/types"

export type UiComposerAttachment = UiAttachment & {
  file: File
}

export type UiComposerAttachmentValidationAccepted = {
  ok: true
  attachment: UiComposerAttachment
}

export type UiComposerAttachmentValidationRejected = {
  ok: false
  attachment: Pick<UiAttachment, "id" | "name" | "mimeType" | "size" | "sourceAttachmentId"> & {
    status: "error"
    rejection: UiAttachmentRejection
  }
}

export type UiComposerAttachmentValidationResult =
  | UiComposerAttachmentValidationAccepted
  | UiComposerAttachmentValidationRejected

export type UiComposerChoice = {
  id: string
  label: string
  insertText: string
}

export type UiComposerValue = {
  text: string
  attachments: UiComposerAttachment[]
  commands: string[]
  mentions: string[]
}
