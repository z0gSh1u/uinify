# Getting Started

Start with the smallest possible setup: install the package, create a runtime, dispatch canonical stream events into it, and render messages with `ChatRoot` plus `MessageList`.

See the matching example template in `examples/templates/minimal-app.tsx`.

For first-time adoption, the recommended default setup is to import `uinify/styles.css` once near your app entrypoint.

## Install

```bash
pnpm add uinify react react-dom
```

## Minimal Setup

```tsx
import { useEffect, useState } from "react"
import { createChatRuntime } from "uinify"
import { ChatRoot, MessageList } from "uinify/react"
import "uinify/styles.css"

export function App() {
  const [runtime] = useState(() => createChatRuntime({ conversationId: "demo" }))

  useEffect(() => {
    runtime.dispatch({
      type: "message.started",
      messageId: "m1",
      role: "assistant",
    })

    runtime.dispatch({
      type: "part.text.delta",
      messageId: "m1",
      partId: "p1",
      delta: "Hello from uinify.",
    })

    runtime.dispatch({
      type: "message.completed",
      messageId: "m1",
    })
  }, [runtime])

  return (
    <ChatRoot runtime={runtime}>
      <MessageList />
    </ChatRoot>
  )
}
```

## What Is Stable

For first adoption, keep your integration centered on `createChatRuntime`, `UiStreamEvent`, `ChatRoot`, and `MessageList`. That is the narrowest recommended surface today for data mapping and the minimal rendering path.

## Next Steps

- Read [Core Concepts](./guides/core-concepts.md) for the runtime and event model.
- Read [Examples](./guides/examples.md) for copyable templates.
- Read [Stream Mapping](./integration/stream-mapping.md) when your backend already has its own event protocol.
- Read [SSE Integration](./integration/sse.md) when your transport is Server-Sent Events.
- Read [Upload Lifecycle](./integration/upload-lifecycle.md) when the composer needs host-owned uploads.
