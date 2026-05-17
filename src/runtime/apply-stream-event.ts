import type { UiMessage, UiMessagePart, UiRuntimeState } from "../model/types"
import type { UiStreamEvent } from "./events"

function appendWarning(state: UiRuntimeState, warning: string): UiRuntimeState {
  return {
    ...state,
    warnings: [...state.warnings, warning],
  }
}

function nextStatus(
  messages: UiRuntimeState["messages"],
  error: UiRuntimeState["error"],
): UiRuntimeState["status"] {
  if (messages.some((message) => message.state === "streaming")) {
    return "streaming"
  }

  return error ? "error" : "idle"
}

function withMessage(
  state: UiRuntimeState,
  messageId: string,
  update: (message: UiMessage) => UiMessage,
): UiRuntimeState {
  const index = state.messages.findIndex((message) => message.id === messageId)

  if (index === -1) {
    return appendWarning(state, `Missing message ${messageId} for event`)
  }

  const messages = [...state.messages]
  messages[index] = update(messages[index]!)

  return {
    ...state,
    messages,
    status: nextStatus(messages, state.error),
  }
}

function upsertPart(parts: UiMessagePart[], part: UiMessagePart): UiMessagePart[] {
  const index = parts.findIndex((item) => item.id === part.id)

  if (index === -1) {
    return [...parts, part]
  }

  const next = [...parts]
  next[index] = part
  return next
}

export function applyStreamEvent(state: UiRuntimeState, event: UiStreamEvent): UiRuntimeState {
  switch (event.type) {
    case "message.started":
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: event.messageId,
            role: event.role,
            parts: [],
            state: "streaming",
            feedback: "none",
          },
        ],
        status: "streaming",
        error: null,
      }

    case "message.completed":
      return withMessage(state, event.messageId, (message) => ({
        ...message,
        state: "complete",
        parts: message.parts.map((part) =>
          part.kind === "reasoning" ? { ...part, state: "complete" } : part,
        ),
      }))

    case "message.failed": {
      const next = withMessage(state, event.messageId, (message) => ({
        ...message,
        state: "error",
      }))

      return {
        ...next,
        error: event.error,
        status: nextStatus(next.messages, event.error),
      }
    }

    case "part.text.delta":
      return withMessage(state, event.messageId, (message) => {
        const current = message.parts.find(
          (part) => part.id === event.partId && part.kind === "text",
        )

        return {
          ...message,
          parts: upsertPart(message.parts, {
            id: event.partId,
            kind: "text",
            text: `${current?.kind === "text" ? current.text : ""}${event.delta}`,
          }),
        }
      })

    case "part.reasoning.delta":
      return withMessage(state, event.messageId, (message) => {
        const current = message.parts.find(
          (part) => part.id === event.partId && part.kind === "reasoning",
        )

        return {
          ...message,
          parts: upsertPart(message.parts, {
            id: event.partId,
            kind: "reasoning",
            text: `${current?.kind === "reasoning" ? current.text : ""}${event.delta}`,
            state: "streaming",
          }),
        }
      })

    case "part.tool.updated":
      return withMessage(state, event.messageId, (message) => {
        const current = message.parts.find(
          (part) => part.id === event.partId && part.kind === "tool-call",
        )
        const inputSummary =
          event.inputSummary ?? (current?.kind === "tool-call" ? current.inputSummary : null)
        const outputSummary =
          event.outputSummary ?? (current?.kind === "tool-call" ? current.outputSummary : null)

        return {
          ...message,
          parts: upsertPart(message.parts, {
            id: event.partId,
            kind: "tool-call",
            toolName: event.toolName,
            status: event.status,
            inputSummary,
            outputSummary,
          }),
        }
      })

    case "part.artifact.emitted":
      return withMessage(state, event.messageId, (message) => ({
        ...message,
        parts: upsertPart(message.parts, {
          id: event.partId,
          kind: "artifact",
          artifact: event.artifact,
        }),
      }))
  }
}
