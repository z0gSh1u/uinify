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

export type UiComposerCommandKind =
  | "slash"
  | "mention"
  | "agent"
  | "tool"
  | "skill"
  | "mcp"
  | "custom"

export type UiComposerCommandTrigger = "/" | "@"

export type UiComposerCommand = {
  id: string
  kind: UiComposerCommandKind
  label: string
  insertText: string
  trigger?: UiComposerCommandTrigger
  description?: string
  group?: string
  disabledReason?: string
  metadata?: Record<string, unknown>
}

export type UiComposerCommandSelection = {
  id: string
  kind: UiComposerCommandKind
  label: string
  insertText: string
  trigger: UiComposerCommandTrigger
  range: {
    start: number
    end: number
  }
  description?: string
  group?: string
  metadata?: Record<string, unknown>
}

export type UiComposerValue = {
  text: string
  attachments: UiComposerAttachment[]
  commands: UiComposerCommandSelection[]
}
