import { useState } from "react"
import { createAdapterRunner, createChatRuntime, type UiAdapterDiagnostic, type UiStreamEvent } from "../../src"
import { ChatRoot, MessageList } from "../../src/react"

type HostEvent =
  | { kind: "host.user"; id: string; text: string }
  | { kind: "host.assistant.started"; id: string }
  | { kind: "host.assistant.delta"; id: string; partId: string; text: string }
  | { kind: "host.tool.started"; id: string; partId: string; label: string; inputSummary: string }
  | { kind: "host.tool.finished"; id: string; partId: string; outputSummary: string }
  | { kind: "host.assistant.finished"; id: string }

const hostEvents: HostEvent[] = [
  {
    kind: "host.user",
    id: "adapter-user",
    text: "Run the release-note adapter over the uploaded changelog.",
  },
  { kind: "host.assistant.started", id: "adapter-assistant" },
  {
    kind: "host.tool.started",
    id: "adapter-assistant",
    partId: "adapter-normalize-step",
    label: "Normalize host event",
    inputSummary: "source=release-note-worker, stream=sse",
  },
  {
    kind: "host.tool.finished",
    id: "adapter-assistant",
    partId: "adapter-normalize-step",
    outputSummary: "6 host events emitted 10 canonical uinify events.",
  },
  {
    kind: "host.assistant.delta",
    id: "adapter-assistant",
    partId: "adapter-assistant-text",
    text: "Mapped host events into uinify transcript events without coupling the UI to the backend protocol.",
  },
  { kind: "host.assistant.finished", id: "adapter-assistant" },
]

function describeHostEvent(event: HostEvent): string {
  switch (event.kind) {
    case "host.user":
      return event.text
    case "host.assistant.started":
      return `Start assistant message ${event.id}`
    case "host.assistant.delta":
      return event.text
    case "host.tool.started":
      return `Start tool step: ${event.label}`
    case "host.tool.finished":
      return event.outputSummary
    case "host.assistant.finished":
      return `Complete assistant message ${event.id}`
  }
}

function mapHostEvent(event: HostEvent): UiStreamEvent[] {
  switch (event.kind) {
    case "host.user":
      return [
        { type: "message.started", messageId: event.id, role: "user" },
        { type: "part.text.delta", messageId: event.id, partId: `${event.id}-text`, delta: event.text },
        { type: "message.completed", messageId: event.id },
      ]
    case "host.assistant.started":
      return [{ type: "message.started", messageId: event.id, role: "assistant" }]
    case "host.assistant.delta":
      return [{ type: "part.text.delta", messageId: event.id, partId: event.partId, delta: event.text }]
    case "host.tool.started":
      return [
        {
          type: "part.step.started",
          messageId: event.id,
          partId: event.partId,
          category: "tool",
          label: event.label,
          inputSummary: event.inputSummary,
        },
      ]
    case "host.tool.finished":
      return [
        {
          type: "part.step.completed",
          messageId: event.id,
          partId: event.partId,
          outputSummary: event.outputSummary,
        },
      ]
    case "host.assistant.finished":
      return [{ type: "message.completed", messageId: event.id }]
  }
}

export function AdapterTemplate() {
  const [{ diagnostics, runtime }] = useState(() => {
    const adaptHostEvent = createAdapterRunner(mapHostEvent)
    const next = createChatRuntime({ conversationId: "template-adapter" })
    const nextDiagnostics: UiAdapterDiagnostic[] = []

    for (const result of hostEvents.map((event) => adaptHostEvent(event))) {
      nextDiagnostics.push(...result.diagnostics)

      for (const event of result.events) {
        next.dispatch(event)
      }
    }

    return {
      diagnostics: nextDiagnostics,
      runtime: next,
    }
  })

  return (
    <section>
      <h2>Adapter integration template</h2>
      <p>Adapter-mapped host events normalized into the shared runtime transcript.</p>
      <ol aria-label="Host events" className="example-event-list">
        {hostEvents.map((event, index) => (
          <li key={`${event.kind}-${index}`}>
            <code>{event.kind}</code>
            <span>{describeHostEvent(event)}</span>
          </li>
        ))}
      </ol>
      {diagnostics.length > 0 ? (
        <section aria-label="Adapter diagnostics">
          <h3>Adapter diagnostics</h3>
          {diagnostics.map((diagnostic) => (
            <p key={diagnostic.message}>{diagnostic.message}</p>
          ))}
        </section>
      ) : null}
      <ChatRoot runtime={runtime}>
        <MessageList />
      </ChatRoot>
    </section>
  )
}
