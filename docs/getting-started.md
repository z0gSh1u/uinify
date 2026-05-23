# Getting Started

Start with the smallest possible setup: create a runtime, dispatch canonical stream events into it, and render messages with `ChatRoot` plus `MessageList`.

See the matching example template in `examples/templates/minimal-app.tsx`.

For first-time adoption, the recommended default setup is to import `uinify/styles.css` once near your app entrypoint.

## Minimal Setup

```tsx
import { useEffect, useState } from "react"
import { createChatRuntime } from "uinify"
import { ChatRoot, MessageList } from "uinify/react"

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
