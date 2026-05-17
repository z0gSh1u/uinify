export type UiComposerAttachment = {
  id: string
  file: File
  status: "ready" | "uploading" | "error"
  error?: string
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
