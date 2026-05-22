import { createAdapterRunner, type UiArtifact, type UiArtifactMetadataValue, type UiArtifactView, type UiMessageRole, type UiStreamEvent } from "../../src"

type AgentLikeMessageStartedEvent = {
  type: "agent.message.started"
  runId: string
  message: {
    id: string
    role: Extract<UiMessageRole, "assistant">
  }
}

type AgentLikeMessageDeltaEvent = {
  type: "agent.message.delta"
  runId: string
  messageId: string
  segment: {
    id: string
    kind: "text"
    text: string
  }
}

type AgentLikeToolEvent = {
  type: "agent.tool.started" | "agent.tool.completed" | "agent.tool.failed"
  runId: string
  messageId: string
  tool: {
    id: string
    name: string
    input?: {
      query?: string
    }
    resultSummary?: string
    error?: string
  }
}

type AgentLikeArtifactEvent = {
  type: "agent.artifact.emitted"
  runId: string
  messageId: string
  artifact: {
    id: string
    kind: string
    title?: string
    metadata?: Record<string, string | number | boolean | null>
    defaultViewId?: string
    views: Array<{
      id: string
      label: string
      mediaType: string
      value: string | Record<string, unknown>
    }>
  }
}

type AgentLikeMessageCompletedEvent = {
  type: "agent.message.completed"
  runId: string
  messageId: string
}

export type AgentLikeEvent =
  | AgentLikeMessageStartedEvent
  | AgentLikeMessageDeltaEvent
  | AgentLikeToolEvent
  | AgentLikeArtifactEvent
  | AgentLikeMessageCompletedEvent

function mapToolStatus(
  eventType: AgentLikeToolEvent["type"],
): Extract<UiStreamEvent, { type: "part.tool.updated" }>["status"] {
  switch (eventType) {
    case "agent.tool.started":
      return "running"
    case "agent.tool.completed":
      return "complete"
    case "agent.tool.failed":
      return "error"
  }
}

function mapArtifactViewKind(mediaType: string): UiArtifactView["kind"] {
  if (mediaType === "application/json") {
    return "structured"
  }

  if (mediaType.startsWith("text/") || mediaType.includes("typescript") || mediaType.includes("javascript")) {
    return "source"
  }

  return "preview"
}

function mapArtifactViewLanguage(mediaType: string): UiArtifactView["language"] {
  if (mediaType.includes("typescript")) {
    return "ts"
  }

  if (mediaType.includes("javascript")) {
    return "js"
  }

  if (mediaType === "application/json") {
    return "json"
  }
}

function mapArtifact(eventArtifact: AgentLikeArtifactEvent["artifact"]): UiArtifact {
  const metadata = eventArtifact.metadata as Record<string, UiArtifactMetadataValue> | undefined

  return {
    id: eventArtifact.id,
    kind: eventArtifact.kind,
    title: eventArtifact.title,
    metadata,
    defaultViewId: eventArtifact.defaultViewId,
    views: eventArtifact.views.map((view) => ({
      id: view.id,
      label: view.label,
      kind: mapArtifactViewKind(view.mediaType),
      language: mapArtifactViewLanguage(view.mediaType),
      value: view.value,
    })),
  }
}

export function mapAgentLikeEvent(event: AgentLikeEvent): UiStreamEvent[] {
  switch (event.type) {
    case "agent.message.started":
      return [
        {
          type: "message.started",
          messageId: event.message.id,
          role: event.message.role,
        },
      ]

    case "agent.message.delta":
      return [
        {
          type: "part.text.delta",
          messageId: event.messageId,
          partId: event.segment.id,
          delta: event.segment.text,
        },
      ]

    case "agent.tool.started":
    case "agent.tool.completed":
    case "agent.tool.failed":
      return [
        {
          type: "part.tool.updated",
          messageId: event.messageId,
          partId: event.tool.id,
          toolName: event.tool.name,
          status: mapToolStatus(event.type),
          inputSummary: event.tool.input?.query ? `query: ${event.tool.input.query}` : undefined,
          outputSummary: event.tool.resultSummary ?? event.tool.error,
        },
      ]

    case "agent.artifact.emitted":
      return [
        {
          type: "part.artifact.emitted",
          messageId: event.messageId,
          partId: event.artifact.id,
          artifact: mapArtifact(event.artifact),
        },
      ]

    case "agent.message.completed":
      return [
        {
          type: "message.completed",
          messageId: event.messageId,
        },
      ]
  }
}

export const adaptAgentLikeEvent = createAdapterRunner(mapAgentLikeEvent)
