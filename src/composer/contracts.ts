import type { UiAttachment } from "../model/types"

export type UiComposerAttachment = UiAttachment & {
  file: File
}

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
