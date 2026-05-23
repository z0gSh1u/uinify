# Stream Mapping

Map your host or backend protocol into `UiStreamEvent` before it reaches the runtime. This keeps `uinify` focused on chat state and rendering instead of vendor-specific transport details.

See the matching example template in `examples/templates/adapter-template.tsx`.

For first-time adoption, the recommended default setup is to import `uinify/styles.css` once near your app entrypoint.

## Pattern

```ts
import type { UiStreamEvent } from "uinify"

type HostEvent =
  | { kind: "begin"; id: string }
  | { kind: "text"; id: string; partId: string; text: string }
  | { kind: "end"; id: string }

export function mapHostEvent(event: HostEvent): UiStreamEvent[] {
  switch (event.kind) {
    case "begin":
      return [
        {
          type: "message.started",
          messageId: event.id,
          role: "assistant",
        },
      ]

    case "text":
      return [
        {
          type: "part.text.delta",
          messageId: event.id,
          partId: event.partId,
          delta: event.text,
        },
      ]

    case "end":
      return [
        {
          type: "message.completed",
          messageId: event.id,
        },
      ]
  }
}
```

Dispatch the mapped events into the runtime:

```ts
for (const streamEvent of mapHostEvent(event)) {
  runtime.dispatch(streamEvent)
}
```

## Stable Adapter Contract

When your mapper becomes a shared integration surface, wrap the pure mapper with `createAdapterRunner`. That gives you a stable result shape with canonical `.events` plus `.diagnostics` for suspicious ordering and invalid artifact views.

```ts
import { createAdapterRunner, type UiStreamEvent } from "uinify"

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

for (const result of incomingEvents.map(adaptHostEvent)) {
  if (result.diagnostics.length > 0) {
    console.warn(result.diagnostics)
  }

  for (const streamEvent of result.events) {
    runtime.dispatch(streamEvent)
  }
}
```

## Rule

`message.started` must arrive before any part events for that message. The runtime does not buffer orphan part events.

Mapping ends at `UiStreamEvent`. Do not pass vendor-specific payloads or transport-specific event objects into `uinify` state. Use `createAdapterResult` and `validateAdapterEvents` directly only if `createAdapterRunner` is not enough for your wrapper.
