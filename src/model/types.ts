export type UiMessageRole = "user" | "assistant" | "tool"

export type UiRuntimeState = {
  conversationId: string
  messages: []
  status: "idle" | "streaming" | "error"
  error: string | null
  warnings: string[]
}
