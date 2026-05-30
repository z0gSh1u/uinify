import {
  createAdapterRunner,
  type UiArtifact,
  type UiArtifactMetadataValue,
  type UiArtifactView,
  type UiMessageRole,
  type UiStreamEvent,
} from "../../src"

type OpenAiLikeResponseStartedChunk = {
  type: "response.started"
  response: {
    response_id: string
    speaker: Extract<UiMessageRole, "assistant">
  }
}

type OpenAiLikeOutputTextDeltaChunk = {
  type: "response.output_text.delta"
  response_id: string
  item: {
    item_id: string
    index: number
  }
  delta: string
}

type OpenAiLikeToolUpdatedChunk = {
  type: "response.tool.updated"
  response_id: string
  tool_call: {
    call_id: string
    name: string
    phase: "in_progress" | "finished" | "failed"
    arguments_text?: string
    result?: {
      summary?: string
    }
  }
}

type OpenAiLikeArtifactChunk = {
  type: "response.artifact"
  response_id: string
  asset: {
    artifact_id: string
    artifact_type: string
    name?: string
    attributes?: Record<string, string | number | boolean | null>
    primary_view?: string
    contents: Array<{
      view_id: string
      title: string
      mime_type: string
      body: string | Record<string, unknown>
    }>
  }
}

type OpenAiLikeResponseCompletedChunk = {
  type: "response.completed"
  response: {
    response_id: string
  }
}

export type OpenAiLikeChunk =
  | OpenAiLikeResponseStartedChunk
  | OpenAiLikeOutputTextDeltaChunk
  | OpenAiLikeToolUpdatedChunk
  | OpenAiLikeArtifactChunk
  | OpenAiLikeResponseCompletedChunk

function mapArtifactViewKind(mimeType: string): UiArtifactView["kind"] {
  if (mimeType === "application/json") {
    return "structured"
  }

  if (mimeType.startsWith("text/") || mimeType.includes("typescript") || mimeType.includes("javascript")) {
    return "source"
  }

  return "preview"
}

function mapArtifactViewLanguage(mimeType: string): UiArtifactView["language"] {
  if (mimeType.includes("typescript")) {
    return "ts"
  }

  if (mimeType.includes("javascript")) {
    return "js"
  }

  if (mimeType === "application/json") {
    return "json"
  }
}

function mapArtifact(asset: OpenAiLikeArtifactChunk["asset"]): UiArtifact {
  const metadata = asset.attributes as Record<string, UiArtifactMetadataValue> | undefined

  return {
    id: asset.artifact_id,
    kind: asset.artifact_type,
    title: asset.name,
    metadata,
    defaultViewId: asset.primary_view,
    views: asset.contents.map((content) => ({
      id: content.view_id,
      label: content.title,
      kind: mapArtifactViewKind(content.mime_type),
      language: mapArtifactViewLanguage(content.mime_type),
      value: content.body,
    })),
  }
}

function summarizeToolArguments(argumentsText: string | undefined) {
  if (!argumentsText) {
    return undefined
  }

  try {
    const parsed = JSON.parse(argumentsText) as { query?: unknown }

    if (typeof parsed.query === "string") {
      return `query: ${parsed.query}`
    }
  } catch {
    return `arguments: ${argumentsText}`
  }

  return `arguments: ${argumentsText}`
}

export function mapOpenAiLikeChunk(chunk: OpenAiLikeChunk): UiStreamEvent[] {
  switch (chunk.type) {
    case "response.started":
      return [
        {
          type: "message.started",
          messageId: chunk.response.response_id,
          role: chunk.response.speaker,
        },
      ]

    case "response.output_text.delta":
      return [
        {
          type: "part.text.delta",
          messageId: chunk.response_id,
          partId: chunk.item.item_id,
          delta: chunk.delta,
        },
      ]

    case "response.tool.updated": {
      const inputSummary = summarizeToolArguments(chunk.tool_call.arguments_text)
      const baseStep = {
        messageId: chunk.response_id,
        partId: chunk.tool_call.call_id,
        category: "tool" as const,
        label: chunk.tool_call.name,
        inputSummary,
      }

      if (chunk.tool_call.phase === "in_progress") {
        return [
          {
            type: "part.step.started",
            ...baseStep,
          },
        ]
      }

      if (chunk.tool_call.phase === "finished") {
        return [
          {
            type: "part.step.started",
            ...baseStep,
          },
          {
            type: "part.step.completed",
            ...baseStep,
            outputSummary: chunk.tool_call.result?.summary,
          },
        ]
      }

      return [
        {
          type: "part.step.started",
          ...baseStep,
        },
        {
          type: "part.step.failed",
          ...baseStep,
          error: chunk.tool_call.result?.summary ?? "Tool failed",
          outputSummary: chunk.tool_call.result?.summary,
        },
      ]
    }

    case "response.artifact":
      return [
        {
          type: "part.artifact.emitted",
          messageId: chunk.response_id,
          partId: chunk.asset.artifact_id,
          artifact: mapArtifact(chunk.asset),
        },
      ]

    case "response.completed":
      return [
        {
          type: "message.completed",
          messageId: chunk.response.response_id,
        },
      ]
  }
}

export const adaptOpenAiLikeChunk = createAdapterRunner(mapOpenAiLikeChunk)
