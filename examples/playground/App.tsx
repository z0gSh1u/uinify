import { useMemo } from "react"
import { createChatRuntime, type UiStreamEvent } from "../../src"
import { ChatRoot, MessageList } from "../../src/react"
import {
  adaptOpenAiLikeChunk,
  openAiLikeDemoChunks,
  type OpenAiLikeChunk,
} from "../adapters/openai-like"
import "./playground.css"

function describeChunk(chunk: OpenAiLikeChunk) {
  switch (chunk.type) {
    case "response.started":
      return chunk.response.response_id
    case "response.output_text.delta":
      return chunk.delta
    case "response.tool.updated":
      return `${chunk.tool_call.name}: ${chunk.tool_call.phase}`
    case "response.artifact":
      return chunk.asset.name ?? chunk.asset.artifact_id
    case "response.completed":
      return chunk.response.response_id
  }
}

function describeMappedEvent(event: UiStreamEvent) {
  switch (event.type) {
    case "message.started":
      return `${event.role} message ${event.messageId}`
    case "part.text.delta":
      return event.delta
    case "part.step.started":
      return `${event.label} started`
    case "part.step.completed":
      return event.outputSummary ?? `${event.partId} completed`
    case "part.step.failed":
      return event.error
    case "part.artifact.emitted":
      return event.artifact.title ?? event.artifact.id
    case "message.completed":
      return `message ${event.messageId} completed`
    default:
      return event.type
  }
}

export function ExamplePlayground() {
  const { diagnostics, mappedEvents, runtime } = useMemo(() => {
    const nextRuntime = createChatRuntime({ conversationId: "openai-like-demo" })
    const nextDiagnostics: string[] = []
    const nextEvents: UiStreamEvent[] = []

    for (const chunk of openAiLikeDemoChunks) {
      const result = adaptOpenAiLikeChunk(chunk)

      nextDiagnostics.push(...result.diagnostics.map((diagnostic) => diagnostic.message))
      nextEvents.push(...result.events)

      for (const event of result.events) {
        nextRuntime.dispatch(event)
      }
    }

    return {
      diagnostics: nextDiagnostics,
      mappedEvents: nextEvents,
      runtime: nextRuntime,
    }
  }, [])

  return (
    <section className="playground-route" aria-label="OpenAI-like adapter example">
      <div className="example-preview-header">
        <div>
          <p className="example-eyebrow">Runtime output</p>
          <h2>Mapped transcript</h2>
        </div>
        <span>{mappedEvents.length} UI events</span>
      </div>

      <div className="example-transcript">
        <ChatRoot runtime={runtime}>
          <MessageList />
        </ChatRoot>
      </div>

      <div className="example-stream-grid">
        <section>
          <h3>Input chunks</h3>
          <ol className="example-event-list">
            {openAiLikeDemoChunks.map((chunk, index) => (
              <li key={`${chunk.type}-${index}`}>
                <code>{chunk.type}</code>
                <span>{describeChunk(chunk)}</span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h3>Mapped events</h3>
          <ol className="example-event-list">
            {mappedEvents.map((event, index) => (
              <li key={`${event.type}-${index}`}>
                <code>{event.type}</code>
                <span>{describeMappedEvent(event)}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <details className="example-details">
        <summary>Adapter diagnostics</summary>
        {diagnostics.length > 0 ? (
          <ul>
            {diagnostics.map((diagnostic) => (
              <li key={diagnostic}>{diagnostic}</li>
            ))}
          </ul>
        ) : (
          <p>No adapter diagnostics for this stream.</p>
        )}
      </details>
    </section>
  )
}
