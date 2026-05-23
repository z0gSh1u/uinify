# Message List

`MessageList` is the default transcript renderer from `uinify/react`.

## Basic Usage

```tsx
import { ChatRoot, MessageList } from "uinify/react"

<ChatRoot runtime={runtime}>
  <MessageList />
</ChatRoot>
```

`ChatRoot` provides the runtime state and shared rendering context. `MessageList` reads that context and renders the conversation in order.

## What You Get

- transcript rendering for assistant and user messages
- built-in rendering for text, reasoning, tool-call, artifact, image, and attachment parts
- action surfaces when the matching handlers are provided through `ChatRoot`

## When To Customize

Start with styling and renderer overrides before replacing the transcript shell.

- Use [Theming](../styling/theming.md) for tokens such as colors and spacing.
- Use [Stable Slots](../styling/slots.md) for durable selectors and `slotClassNames` keys.
- Use the artifact and renderer docs when a specific part type needs a custom presentation.

If you are adopting `uinify` for the first time, keep `MessageList` and move your integration effort into event mapping and host callbacks.
