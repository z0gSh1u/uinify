# SSE Integration

Use `uinify/sse` when your backend already streams Server-Sent Events. The SSE helpers only read transport frames. Your app still maps each parsed payload into `UiStreamEvent` before dispatching to the runtime.

## Basic Flow

```ts
import { createChatRuntime, type UiStreamEvent } from "uinify"
import { createSSEStream } from "uinify/sse"

type SsePayload = {
  type: "start" | "text" | "done"
  messageId: string
  partId?: string
  text?: string
}

function mapSsePayload(payload: SsePayload): UiStreamEvent[] {
  switch (payload.type) {
    case "start":
      return [{ type: "message.started", messageId: payload.messageId, role: "assistant" }]
    case "text":
      return payload.partId && payload.text
        ? [{ type: "part.text.delta", messageId: payload.messageId, partId: payload.partId, delta: payload.text }]
        : []
    case "done":
      return [{ type: "message.completed", messageId: payload.messageId }]
  }
}

const runtime = createChatRuntime({ conversationId: "demo" })

for await (const event of createSSEStream("/api/chat")) {
  const payload = JSON.parse(event.data) as SsePayload

  for (const streamEvent of mapSsePayload(payload)) {
    runtime.dispatch(streamEvent)
  }
}
```

Keep the mapping step separate so transport handling does not leak into runtime state.

## When To Use Which Helper

- `createSSEStream`: fetches a URL and yields parsed SSE events
- `readSSEStream`: parses an existing `ReadableStream<Uint8Array>` when your host already owns the request layer

## Practical Notes

- `createSSEStream` throws on non-OK responses or missing response bodies.
- The parsed shape is `{ event, data }`; decode `data` into your host payload before mapping.
- `uinify` does not assume a vendor-specific SSE event schema.

## Where To Go Next

- For canonical event mapping, see [Stream Mapping](./stream-mapping.md).
- For copyable recipes, see [Examples](../guides/examples.md).
