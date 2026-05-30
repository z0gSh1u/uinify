import type { UiStreamEvent } from "../runtime/events"
import type { UiAdapterDiagnostic } from "./contracts"

type ValidateAdapterEventsInput = {
  diagnostics?: UiAdapterDiagnostic[]
  knownStartedMessageIds?: Iterable<string>
  knownStepPartIds?: Iterable<string>
}

const MESSAGE_START_REQUIRED_EVENT_TYPES: UiStreamEvent["type"][] = [
  "message.completed",
  "message.failed",
  "part.text.delta",
  "part.reasoning.delta",
  "part.step.started",
  "part.step.updated",
  "part.step.completed",
  "part.step.failed",
  "part.image.emitted",
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
  const seenStepKeys = new Set(input.knownStepPartIds)

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

    if (event.type === "part.step.started" || event.type === "part.step.updated") {
      seenStepKeys.add(`${event.messageId}:${event.partId}`)
    }

    if (
      (event.type === "part.step.completed" || event.type === "part.step.failed") &&
      startedMessageIds.has(event.messageId) &&
      !seenStepKeys.has(`${event.messageId}:${event.partId}`)
    ) {
      diagnostics.push({
        level: "warning",
        code: "invalid-artifact",
        message: `Step "${event.partId}" completed or failed before it was started or updated for message "${event.messageId}".`,
      })
    }

    if (event.type === "part.step.completed" || event.type === "part.step.failed") {
      seenStepKeys.add(`${event.messageId}:${event.partId}`)
    }

    if (event.type === "part.artifact.emitted" && event.artifact.views.length === 0) {
      diagnostics.push({
        level: "warning",
        code: "invalid-artifact",
        message: `Artifact "${event.artifact.id}" must include at least one view.`,
      })
    }

    if (event.type === "part.image.emitted" && event.image.url.trim() === "") {
      diagnostics.push({
        level: "warning",
        code: "invalid-artifact",
        message: `Image "${event.partId}" must include a URL.`,
      })
    }
  }

  return diagnostics
}
