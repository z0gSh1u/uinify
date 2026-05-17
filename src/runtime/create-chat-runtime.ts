import type { UiRuntimeState } from "../model/types"

type Listener = () => void

export function createChatRuntime(input: { conversationId?: string } = {}) {
  let state: UiRuntimeState = {
    conversationId: input.conversationId ?? "default",
    messages: [],
    status: "idle",
    error: null,
    warnings: [],
  }

  const listeners = new Set<Listener>()

  return {
    getState() {
      return state
    },
    setState(next: UiRuntimeState) {
      state = next
      listeners.forEach((listener) => listener())
    },
    subscribe(listener: Listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
