import { useSyncExternalStore } from "react"
import type { createChatRuntime } from "./create-chat-runtime"

export function useChatSession(runtime: ReturnType<typeof createChatRuntime>) {
  return useSyncExternalStore(runtime.subscribe, runtime.getState, runtime.getState)
}
