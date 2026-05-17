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

export type UiArtifact = {
  id: string
  kind: "code" | "text"
  language?: string
  content: string
}

export type UiArtifactPart = {
  id: string
  kind: "artifact"
  artifact: UiArtifact
}

export type UiMessagePart =
  | UiTextPart
  | UiImagePart
  | UiReasoningPart
  | UiToolCallPart
  | UiArtifactPart

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
