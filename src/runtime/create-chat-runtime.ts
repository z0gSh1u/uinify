import type { UiRuntimeState } from "../model/types"
import { applyStreamEvent } from "./apply-stream-event"
import type { UiStreamEvent } from "./events"

type Listener = () => void
type StateUpdater = UiRuntimeState | ((current: UiRuntimeState) => UiRuntimeState)

export function createChatRuntime(input: { conversationId?: string } = {}) {
  let state: UiRuntimeState = {
    conversationId: input.conversationId ?? "default",
    messages: [],
    status: "idle",
    error: null,
    warnings: [],
  }

  const listeners = new Set<Listener>()
  const emit = () => listeners.forEach((listener) => listener())

  return {
    getState() {
      return state
    },
    setState(next: StateUpdater) {
      if (typeof next === "function") {
        state = next(state)
      } else {
        state = next
      }

      emit()
    },
    dispatch(event: UiStreamEvent) {
      state = applyStreamEvent(state, event)
      emit()
    },
    subscribe(listener: Listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
