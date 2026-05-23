import { useState } from "react"
import { createAdapterRunner, createChatRuntime, type UiAdapterDiagnostic, type UiStreamEvent } from "../../src"
import { ChatRoot, MessageList } from "../../src/react"

type HostEvent =
  | { kind: "begin"; id: string }
  | { kind: "text"; id: string; partId: string; text: string }
  | { kind: "end"; id: string }

function mapHostEvent(event: HostEvent): UiStreamEvent[] {
  switch (event.kind) {
    case "begin":
      return [{ type: "message.started", messageId: event.id, role: "assistant" }]
    case "text":
      return [{ type: "part.text.delta", messageId: event.id, partId: event.partId, delta: event.text }]
    case "end":
      return [{ type: "message.completed", messageId: event.id }]
  }
}

const adaptHostEvent = createAdapterRunner(mapHostEvent)

export function AdapterTemplate() {
  const [{ diagnostics, runtime }] = useState(() => {
    const next = createChatRuntime({ conversationId: "template-adapter" })
    const nextDiagnostics: UiAdapterDiagnostic[] = []

    for (const result of [
      adaptHostEvent({ kind: "begin", id: "adapter-assistant" }),
      adaptHostEvent({
        kind: "text",
        id: "adapter-assistant",
        partId: "adapter-assistant-text",
        text: "Adapter integration template",
      }),
      adaptHostEvent({ kind: "end", id: "adapter-assistant" }),
    ]) {
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
      <p>{diagnostics.length === 0 ? "No adapter diagnostics for this transcript." : diagnostics[0]?.message}</p>
      <ChatRoot runtime={runtime}>
        <MessageList />
      </ChatRoot>
    </section>
  )
}
