import type { OpenAICompatibleChatMessage } from "../../../server/openai-compatible-chat"

export type LiveChatHistoryMessage = Pick<OpenAICompatibleChatMessage, "role" | "content">
