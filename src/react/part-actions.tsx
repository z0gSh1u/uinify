import type { UiMessage, UiMessagePart } from "../model/types"
import { getDefaultArtifactView } from "./artifact-body"
import { getArtifactViewPayload, getAvailablePartActions } from "./actions"
import {
  useChatActionHandlers,
  type BasePartActionPayload,
  type PartActionPayload,
} from "./chat-root"

export type PartActionsProps = {
  message: UiMessage
  part: UiMessagePart
}

function getPartLabel(part: UiMessagePart) {
  switch (part.kind) {
    case "artifact":
      return "Artifact"
    default:
      return `${part.kind[0]!.toUpperCase()}${part.kind.slice(1)}`
  }
}

function getActionAriaLabel(part: UiMessagePart, label: string) {
  if (label === "Copy") {
    return `Copy ${part.kind} part`
  }

  if (label === "Reasoning") {
    return "Toggle reasoning"
  }

  return label
}

function getPartActionPayload(
  message: UiMessage,
  part: UiMessagePart,
  action: ReturnType<typeof getAvailablePartActions>[number]["id"],
): PartActionPayload | null {
  if (action === "open-artifact-view") {
    if (part.kind !== "artifact") {
      return null
    }

    const defaultView = getDefaultArtifactView(part.artifact)

    if (!defaultView) {
      return null
    }

    return {
      ...getArtifactViewPayload(part, defaultView.id),
      messageId: message.id,
      partKind: part.kind,
    }
  }

  const payload: BasePartActionPayload = {
    action,
    messageId: message.id,
    partId: part.id,
    partKind: part.kind,
  }

  return payload
}

export function PartActions({ message, part }: PartActionsProps) {
  const actions = getAvailablePartActions(part)
  const { onPartAction } = useChatActionHandlers()

  if (actions.length === 0) {
    return null
  }

  return (
    <div aria-label={`${getPartLabel(part)} part actions`} data-slot="part-actions" role="group">
      {actions.map((action) => (
        <button
          aria-label={getActionAriaLabel(part, action.label)}
          key={action.id}
          onClick={() => {
            const payload = getPartActionPayload(message, part, action.id)

            if (payload) {
              onPartAction?.(payload)
            }
          }}
          type="button"
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
