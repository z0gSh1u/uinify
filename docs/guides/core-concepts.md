# Core Concepts

Use `uinify` as a small stack of responsibilities:

- your app owns transport, auth, uploads, and vendor-specific payloads
- `UiStreamEvent` is the handoff shape between your host integration and the library
- `createChatRuntime` stores canonical message state
- `ChatRoot` and `MessageList` render that state

## Runtime Shape

The recommended adoption surface is still narrow:

- `createChatRuntime` to hold transcript state
- `UiStreamEvent` to describe message and part updates
- `ChatRoot` and `MessageList` to render the transcript

That gives you one place to normalize backend events before they touch UI code.

## Event Flow

Most integrations follow the same loop:

```ts
import { createChatRuntime, type UiStreamEvent } from "uinify"

const runtime = createChatRuntime({ conversationId: "demo" })

function dispatchEvents(events: UiStreamEvent[]) {
  for (const event of events) {
    runtime.dispatch(event)
  }
}
```

The important rule is ordering: send `message.started` before any part events for that message.

## Rendering Model

`ChatRoot` provides runtime state and rendering hooks. `MessageList` gives you the default transcript UI. Start there before replacing renderers or building custom shells.

```tsx
import { ChatRoot, MessageList } from "uinify/react"

<ChatRoot runtime={runtime}>
  <MessageList />
</ChatRoot>
```

## Where To Go Next

- For a first integration, see [Getting Started](../getting-started.md).
- For transport mapping, see [Stream Mapping](../integration/stream-mapping.md).
- For concrete templates, see [Examples](./examples.md).
