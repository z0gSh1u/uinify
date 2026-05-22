import type { UiStreamEvent } from "../runtime/events"
import { createAdapterResult, type UiAdapterResult } from "./contracts"
import { validateAdapterEvents } from "./validate-events"

export function createAdapterRunner<TInput>(
  map: (input: TInput) => UiStreamEvent[],
): (input: TInput) => UiAdapterResult {
  const startedMessageIds = new Set<string>()

  return (input) => {
    const events = map(input)
    const diagnostics = validateAdapterEvents(events, { knownStartedMessageIds: startedMessageIds })

    for (const event of events) {
      if (event.type === "message.started") {
        startedMessageIds.add(event.messageId)
        continue
      }

      if (event.type === "message.completed" || event.type === "message.failed") {
        startedMessageIds.delete(event.messageId)
      }
    }

    return createAdapterResult(events, diagnostics)
  }
}
