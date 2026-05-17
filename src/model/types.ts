export type UiMessageRole = "user" | "assistant" | "tool"

export type UiTextPart = {
  id: string
  kind: "text"
  text: string
}

export type UiImagePart = {
  id: string
  kind: "image"
  url: string
  alt?: string
}

export type UiReasoningPart = {
  id: string
  kind: "reasoning"
  text: string
  state: "streaming" | "complete"
}

export type UiToolCallPart = {
  id: string
  kind: "tool-call"
  toolName: string
  status: "input-streaming" | "running" | "complete" | "error"
  inputSummary: string | null
  outputSummary: string | null
}

export type UiAttachmentStatus = "queued" | "uploading" | "uploaded" | "error" | "removed"

export type UiAttachment = {
  id: string
  name: string
  mimeType?: string
  size?: number
  status: UiAttachmentStatus
  progress?: number
  error?: string
  remoteUrl?: string
}

export type UiArtifactMetadataValue = string | number | boolean | null

export type UiArtifactView = {
  id: string
  label: string
  kind: "source" | "preview" | "structured"
  language?: string
  value: string | Record<string, unknown>
}

export type UiArtifact = {
  id: string
  kind: string
  title?: string
  metadata?: Record<string, UiArtifactMetadataValue>
  defaultViewId?: string
  views: UiArtifactView[]
}

export type UiArtifactPart = {
  id: string
  kind: "artifact"
  artifact: UiArtifact
}

export type UiAttachmentPart = {
  id: string
  kind: "attachment"
  attachment: UiAttachment
}

export type UiMessagePart =
  | UiTextPart
  | UiImagePart
  | UiReasoningPart
  | UiToolCallPart
  | UiArtifactPart
  | UiAttachmentPart

export type UiMessage = {
  id: string
  role: UiMessageRole
  parts: UiMessagePart[]
  state: "streaming" | "complete" | "error"
  feedback: "up" | "down" | "none"
}

export type UiRuntimeState = {
  conversationId: string
  messages: UiMessage[]
  status: "idle" | "streaming" | "error"
  error: string | null
  warnings: string[]
}
