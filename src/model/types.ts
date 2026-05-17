export type UiMessageRole = "user" | "assistant" | "tool"

export type UiRuntimeState = {
  conversationId: string
  messages: string[]
  status: "idle" | "streaming" | "error"
  error: string | null
  warnings: string[]
}
