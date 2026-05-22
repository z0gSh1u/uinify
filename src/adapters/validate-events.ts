import type { UiStreamEvent } from "../runtime/events"
import type { UiAdapterDiagnostic } from "./contracts"

type ValidateAdapterEventsInput = {
  diagnostics?: UiAdapterDiagnostic[]
  knownStartedMessageIds?: Iterable<string>
}

const MESSAGE_START_REQUIRED_EVENT_TYPES: UiStreamEvent["type"][] = [
  "message.completed",
  "message.failed",
  "part.text.delta",
  "part.reasoning.delta",
  "part.tool.updated",
  "part.artifact.emitted",
  "part.attachment.updated",
]

export function validateAdapterEvents(
  events: UiStreamEvent[],
  input: ValidateAdapterEventsInput = {},
): UiAdapterDiagnostic[] {
  const diagnostics = [...(input.diagnostics ?? [])]

  if (events.length === 0) {
    diagnostics.push({
      level: "warning",
      code: "empty-output",
      message: "Adapter produced no events.",
    })

    return diagnostics
  }

  const startedMessageIds = new Set(input.knownStartedMessageIds)

  for (const event of events) {
    if (event.type === "message.started") {
      startedMessageIds.add(event.messageId)
      continue
    }

    if (MESSAGE_START_REQUIRED_EVENT_TYPES.includes(event.type) && !startedMessageIds.has(event.messageId)) {
      diagnostics.push({
        level: "warning",
        code: "missing-message-start",
        message: `Event "${event.type}" arrived before "message.started" for message "${event.messageId}".`,
      })
    }

    if (event.type === "part.artifact.emitted" && event.artifact.views.length === 0) {
      diagnostics.push({
        level: "warning",
        code: "invalid-artifact",
        message: `Artifact "${event.artifact.id}" must include at least one view.`,
      })
    }
  }

  return diagnostics
}
