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
  mimeType?: string
  width?: number
  height?: number
  sourceAttachmentId?: string
}

export type UiReasoningPart = {
  id: string
  kind: "reasoning"
  text: string
  state: "streaming" | "complete"
}

export type UiStepCategory = "tool" | "retrieval" | "handoff" | "planner" | "workflow" | "skill" | "custom"

export type UiStepStatus = "pending" | "running" | "complete" | "error"

export type UiStepPart = {
  id: string
  kind: "step"
  category: UiStepCategory
  status: UiStepStatus
  label: string
  summary?: string
  inputSummary?: string
  outputSummary?: string
  error?: string
  startedAt?: string
  completedAt?: string
  metadata?: Record<string, unknown>
}

export type UiAttachmentStatus = "queued" | "uploading" | "uploaded" | "error" | "removed"

export type UiAttachmentRejectionCode =
  | "file-too-large"
  | "invalid-type"
  | "too-many-files"
  | "empty-file"
  | "unknown"

export type UiAttachmentRejection = {
  code: UiAttachmentRejectionCode
  message: string
}

export type UiAttachment = {
  id: string
  name: string
  mimeType?: string
  size?: number
  status: UiAttachmentStatus
  sourceAttachmentId?: string
  progress?: number
  error?: string
  remoteUrl?: string
  rejection?: UiAttachmentRejection
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
  | UiStepPart
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
