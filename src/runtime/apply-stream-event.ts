import type { UiAttachment, UiImagePart, UiMessage, UiMessagePart, UiRuntimeState, UiStepPart } from "../model/types"
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

function nextAttachment(current: UiAttachment | undefined, incoming: UiAttachment): UiAttachment {
  const base = {
    id: incoming.id,
    name: incoming.name,
    mimeType: incoming.mimeType ?? current?.mimeType,
    size: incoming.size ?? current?.size,
    sourceAttachmentId: incoming.sourceAttachmentId ?? current?.sourceAttachmentId,
  }

  switch (incoming.status) {
    case "queued":
      return {
        ...base,
        status: incoming.status,
        ...(incoming.rejection ? { rejection: incoming.rejection } : {}),
      }

    case "uploading":
      return {
        ...base,
        status: incoming.status,
        ...(incoming.progress !== undefined ? { progress: incoming.progress } : {}),
        ...(incoming.rejection ? { rejection: incoming.rejection } : {}),
      }

    case "uploaded":
      return {
        ...base,
        status: incoming.status,
        ...(incoming.remoteUrl ?? current?.remoteUrl
          ? { remoteUrl: incoming.remoteUrl ?? current?.remoteUrl }
          : {}),
      }

    case "error":
      return {
        ...base,
        status: incoming.status,
        ...(incoming.error !== undefined ? { error: incoming.error } : {}),
        ...(incoming.rejection ? { rejection: incoming.rejection } : {}),
      }

    case "removed":
      return {
        id: incoming.id,
        name: incoming.name,
        status: incoming.status,
        ...(incoming.sourceAttachmentId ?? current?.sourceAttachmentId
          ? { sourceAttachmentId: incoming.sourceAttachmentId ?? current?.sourceAttachmentId }
          : {}),
        ...(incoming.rejection ? { rejection: incoming.rejection } : {}),
      }
  }
}

function mergeStepPart(
  current: UiStepPart | undefined,
  patch: Partial<UiStepPart> & Pick<UiStepPart, "id" | "kind" | "status">,
): UiStepPart {
  const next = {
    ...(current ?? {
      category: "custom",
      label: patch.id,
    }),
    ...patch,
    metadata: patch.metadata ?? current?.metadata,
  }

  if (next.status === "running") {
    delete next.error
    delete next.outputSummary
    delete next.completedAt
  }

  if (next.status === "complete") {
    delete next.error
  }

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

    case "part.step.started":
      return withMessage(state, event.messageId, (message) => {
        const currentStep = message.parts.find(
          (part): part is UiStepPart => part.id === event.partId && part.kind === "step",
        )

        return {
          ...message,
          parts: upsertPart(
            message.parts,
            mergeStepPart(currentStep, {
              id: event.partId,
              kind: "step",
              category: event.category,
              status: "running",
              label: event.label,
              ...(event.summary !== undefined ? { summary: event.summary } : {}),
              ...(event.inputSummary !== undefined ? { inputSummary: event.inputSummary } : {}),
              ...(event.startedAt !== undefined ? { startedAt: event.startedAt } : {}),
              ...(event.metadata !== undefined ? { metadata: event.metadata } : {}),
            }),
          ),
        }
      })

    case "part.step.updated":
      return withMessage(state, event.messageId, (message) => {
        const currentStep = message.parts.find(
          (part): part is UiStepPart => part.id === event.partId && part.kind === "step",
        )

        return {
          ...message,
          parts: upsertPart(
            message.parts,
            mergeStepPart(currentStep, {
              id: event.partId,
              kind: "step",
              status: event.status ?? currentStep?.status ?? "running",
              ...(event.category !== undefined ? { category: event.category } : {}),
              ...(event.label !== undefined ? { label: event.label } : {}),
              ...(event.summary !== undefined ? { summary: event.summary } : {}),
              ...(event.inputSummary !== undefined ? { inputSummary: event.inputSummary } : {}),
              ...(event.outputSummary !== undefined ? { outputSummary: event.outputSummary } : {}),
              ...(event.error !== undefined ? { error: event.error } : {}),
              ...(event.startedAt !== undefined ? { startedAt: event.startedAt } : {}),
              ...(event.completedAt !== undefined ? { completedAt: event.completedAt } : {}),
              ...(event.metadata !== undefined ? { metadata: event.metadata } : {}),
            }),
          ),
        }
      })

    case "part.step.completed":
      return withMessage(state, event.messageId, (message) => {
        const currentStep = message.parts.find(
          (part): part is UiStepPart => part.id === event.partId && part.kind === "step",
        )

        return {
          ...message,
          parts: upsertPart(
            message.parts,
            mergeStepPart(currentStep, {
              id: event.partId,
              kind: "step",
              status: "complete",
              ...(event.category !== undefined ? { category: event.category } : {}),
              ...(event.label !== undefined ? { label: event.label } : {}),
              ...(event.summary !== undefined ? { summary: event.summary } : {}),
              ...(event.inputSummary !== undefined ? { inputSummary: event.inputSummary } : {}),
              ...(event.outputSummary !== undefined ? { outputSummary: event.outputSummary } : {}),
              ...(event.completedAt !== undefined ? { completedAt: event.completedAt } : {}),
              ...(event.metadata !== undefined ? { metadata: event.metadata } : {}),
            }),
          ),
        }
      })

    case "part.step.failed":
      return withMessage(state, event.messageId, (message) => {
        const currentStep = message.parts.find(
          (part): part is UiStepPart => part.id === event.partId && part.kind === "step",
        )

        return {
          ...message,
          parts: upsertPart(
            message.parts,
            mergeStepPart(currentStep, {
              id: event.partId,
              kind: "step",
              status: "error",
              error: event.error,
              ...(event.category !== undefined ? { category: event.category } : {}),
              ...(event.label !== undefined ? { label: event.label } : {}),
              ...(event.summary !== undefined ? { summary: event.summary } : {}),
              ...(event.inputSummary !== undefined ? { inputSummary: event.inputSummary } : {}),
              ...(event.outputSummary !== undefined ? { outputSummary: event.outputSummary } : {}),
              ...(event.completedAt !== undefined ? { completedAt: event.completedAt } : {}),
              ...(event.metadata !== undefined ? { metadata: event.metadata } : {}),
            }),
          ),
        }
      })

    case "part.image.emitted":
      return withMessage(state, event.messageId, (message) => ({
        ...message,
        parts: upsertPart(message.parts, {
          ...event.image,
          id: event.partId,
          kind: "image",
        } satisfies UiImagePart),
      }))

    case "part.artifact.emitted":
      return withMessage(state, event.messageId, (message) => ({
        ...message,
        parts: upsertPart(message.parts, {
          id: event.partId,
          kind: "artifact",
          artifact: event.artifact,
        }),
      }))

    case "part.attachment.updated":
      return withMessage(state, event.messageId, (message) => {
        const current = message.parts.find(
          (part) => part.id === event.partId && part.kind === "attachment",
        )

        return {
          ...message,
          parts: upsertPart(message.parts, {
            id: event.partId,
            kind: "attachment",
            attachment: nextAttachment(
              current?.kind === "attachment" ? current.attachment : undefined,
              event.attachment,
            ),
          }),
        }
      })
  }
}
