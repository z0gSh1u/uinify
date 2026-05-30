import type { UiStreamEvent } from "../runtime/events"
import { createAdapterResult, type UiAdapterResult } from "./contracts"
import { validateAdapterEvents } from "./validate-events"

export function createAdapterRunner<TInput>(
  map: (input: TInput) => UiStreamEvent[],
): (input: TInput) => UiAdapterResult {
  const startedMessageIds = new Set<string>()
  const startedStepKeys = new Set<string>()

  return (input) => {
    const events = map(input)
    const diagnostics = validateAdapterEvents(events, {
      knownStartedMessageIds: startedMessageIds,
      knownStepPartIds: startedStepKeys,
    })

    for (const event of events) {
      if (event.type === "message.started") {
        startedMessageIds.add(event.messageId)
        continue
      }

      if (event.type === "part.step.started" || event.type === "part.step.updated") {
        startedStepKeys.add(`${event.messageId}:${event.partId}`)
        continue
      }

      if (event.type === "part.step.completed" || event.type === "part.step.failed") {
        startedStepKeys.add(`${event.messageId}:${event.partId}`)
        continue
      }

      if (event.type === "message.completed" || event.type === "message.failed") {
        startedMessageIds.delete(event.messageId)
        for (const stepKey of startedStepKeys) {
          if (stepKey.startsWith(`${event.messageId}:`)) {
            startedStepKeys.delete(stepKey)
          }
        }
      }
    }

    return createAdapterResult(events, diagnostics)
  }
}
