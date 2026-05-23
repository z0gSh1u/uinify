import type { UiArtifactPart, UiMessage, UiMessagePart } from "../model/types"

export type UiMessageActionId = "copy" | "retry" | "regenerate"

export type UiPartActionId =
  | "copy"
  | "toggle-reasoning"
  | "toggle-tool-details"
  | "open-artifact-view"

export type UiMessageActionDescriptor = {
  id: UiMessageActionId
  label: string
}

export type UiPartActionDescriptor = {
  id: UiPartActionId
  label: string
}

export type UiOpenArtifactViewPayload = {
  action: "open-artifact-view"
  partId: string
  artifactId: string
  artifactKind: string
  viewId: string
}

function createMessageAction(id: UiMessageActionId, label: string): UiMessageActionDescriptor {
  return { id, label }
}

function createPartAction(id: UiPartActionId, label: string): UiPartActionDescriptor {
  return { id, label }
}

export function getAvailableMessageActions(message: UiMessage): UiMessageActionDescriptor[] {
  if (message.role === "assistant" && message.state === "complete") {
    return [
      createMessageAction("copy", "Copy"),
      createMessageAction("retry", "Retry"),
      createMessageAction("regenerate", "Regenerate"),
    ]
  }

  return []
}

export function getAvailablePartActions(part: UiMessagePart): UiPartActionDescriptor[] {
  switch (part.kind) {
    case "reasoning":
      return [
        createPartAction("toggle-reasoning", "Reasoning"),
        createPartAction("copy", "Copy"),
      ]
    case "tool-call":
      return [
        createPartAction("toggle-tool-details", "Tool details"),
        createPartAction("copy", "Copy"),
      ]
    case "artifact":
      return part.artifact.views.length > 1
        ? [createPartAction("open-artifact-view", "Open artifact view")]
        : []
    case "text":
      return [createPartAction("copy", "Copy")]
    default:
      return []
  }
}

export function getArtifactViewPayload(
  part: UiArtifactPart,
  viewId: string,
): UiOpenArtifactViewPayload {
  return {
    action: "open-artifact-view",
    partId: part.id,
    artifactId: part.artifact.id,
    artifactKind: part.artifact.kind,
    viewId,
  }
}
