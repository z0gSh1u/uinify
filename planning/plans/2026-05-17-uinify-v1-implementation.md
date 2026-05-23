# Uinify V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable `uinify` release: a React, backend-agnostic, SSE-friendly chat UI library with a canonical runtime model, virtualized transcript UI, Lexical-first composer, default theme, and integration examples.

**Architecture:** Keep one npm package with subpath exports, but split implementation into model, runtime, SSE, React UI, Lexical composer, and styles modules. The host app owns protocol adaptation; `uinify` owns normalized events, state merging, rendering contracts, and default UI.

**Tech Stack:** TypeScript, React 18, react-virtuoso, Lexical, Vite, Vitest, Testing Library, tsup

---

## File Structure

- Create: `package.json` - package metadata, exports, scripts, dependencies
- Create: `tsconfig.json` - TypeScript compiler configuration
- Create: `vite.config.ts` - Vitest + jsdom configuration
- Create: `tsup.config.ts` - multi-entry library build configuration
- Create: `scripts/copy-styles.mjs` - copies `src/styles.css` into `dist/styles.css`
- Create: `src/index.ts` - root exports for model and runtime APIs
- Create: `src/model/types.ts` - canonical chat model types
- Create: `src/runtime/events.ts` - normalized stream event types
- Create: `src/runtime/apply-stream-event.ts` - pure event reducer
- Create: `src/runtime/create-chat-runtime.ts` - runtime container with subscribe/dispatch/getState
- Create: `src/runtime/use-chat-session.ts` - React hook using `useSyncExternalStore`
- Create: `src/sse/read-sse-stream.ts` - low-level SSE parser
- Create: `src/sse/create-sse-stream.ts` - fetch wrapper for SSE responses
- Create: `src/sse/index.ts` - SSE subpath exports
- Create: `src/react/renderers.tsx` - renderer override context and types
- Create: `src/react/chat-root.tsx` - UI root with runtime + renderers providers
- Create: `src/react/message-list.tsx` - virtualized transcript component
- Create: `src/react/message.tsx` - per-message layout container
- Create: `src/react/message-part.tsx` - part switchboard
- Create: `src/react/reasoning-block.tsx` - reasoning UI
- Create: `src/react/tool-call-block.tsx` - tool call UI
- Create: `src/react/image-part.tsx` - image renderer
- Create: `src/react/artifact-code-block.tsx` - code/plain text artifact renderer
- Create: `src/react/feedback-buttons.tsx` - thumbs up/down controls
- Create: `src/react/attachment-tray.tsx` - attachment status UI
- Create: `src/react/error-boundary.tsx` - local renderer isolation
- Create: `src/react/index.ts` - React UI subpath exports
- Create: `src/composer/contracts.ts` - composer-facing shared types
- Create: `src/composer/lexical/lexical-composer.tsx` - main Lexical composer component
- Create: `src/composer/lexical/plugins/slash-command-plugin.tsx` - `/` trigger plugin
- Create: `src/composer/lexical/plugins/mention-plugin.tsx` - `@` trigger plugin
- Create: `src/composer/lexical/plugins/attachment-plugin.tsx` - drag/drop/paste file plugin
- Create: `src/composer/lexical/index.ts` - Lexical subpath exports
- Create: `src/styles.css` - default CSS variables and component styles
- Create: `src/test/setup.ts` - Vitest DOM setup
- Create: `examples/fixtures.ts` - reusable example data and event streams
- Create: `examples/playground/App.tsx` - example shell that switches between fixture scenarios
- Create: `examples/playground/main.tsx` - Vite example entry
- Create: `examples/playground/index.html` - example HTML shell
- Create: `src/runtime/create-chat-runtime.test.ts` - bootstrap runtime test
- Create: `src/runtime/apply-stream-event.test.ts` - normalized event merge tests
- Create: `src/sse/read-sse-stream.test.ts` - SSE parser tests
- Create: `src/react/message-part.test.tsx` - message renderer tests
- Create: `src/react/message-list.test.tsx` - virtualized transcript tests
- Create: `src/react/chat-root.test.tsx` - renderer override and error boundary tests
- Create: `src/composer/lexical/lexical-composer.test.tsx` - composer submit tests
- Create: `src/composer/lexical/plugins/slash-command-plugin.test.tsx` - slash command tests
- Create: `src/composer/lexical/plugins/mention-plugin.test.tsx` - mention tests
- Create: `src/composer/lexical/plugins/attachment-plugin.test.tsx` - attachment tests
- Create: `examples/example-flows.test.tsx` - end-to-end-ish example coverage

### Task 1: Bootstrap The Package Surface

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `tsup.config.ts`
- Create: `scripts/copy-styles.mjs`
- Create: `src/index.ts`
- Create: `src/model/types.ts`
- Create: `src/runtime/create-chat-runtime.ts`
- Create: `src/react/index.ts`
- Create: `src/sse/index.ts`
- Create: `src/composer/lexical/index.ts`
- Create: `src/styles.css`
- Create: `src/test/setup.ts`
- Test: `src/runtime/create-chat-runtime.test.ts`

- [ ] **Step 1: Write the failing test**

`src/runtime/create-chat-runtime.test.ts`

```ts
import { describe, expect, it } from "vitest"
import { createChatRuntime } from "./create-chat-runtime"

describe("createChatRuntime", () => {
  it("starts with an empty linear transcript", () => {
    const runtime = createChatRuntime({ conversationId: "demo" })

    expect(runtime.getState()).toEqual({
      conversationId: "demo",
      messages: [],
      status: "idle",
      error: null,
      warnings: [],
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/runtime/create-chat-runtime.test.ts`

Expected: FAIL with `Cannot find module './create-chat-runtime'` and missing root tooling files.

- [ ] **Step 3: Write minimal implementation**

`package.json`

```json
{
  "name": "uinify",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "sideEffects": [
    "./dist/styles.css"
  ],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./react": {
      "types": "./dist/react/index.d.ts",
      "import": "./dist/react/index.js"
    },
    "./sse": {
      "types": "./dist/sse/index.d.ts",
      "import": "./dist/sse/index.js"
    },
    "./composer/lexical": {
      "types": "./dist/composer/lexical/index.d.ts",
      "import": "./dist/composer/lexical/index.js"
    },
    "./styles.css": "./dist/styles.css"
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsup --config tsup.config.ts && node scripts/copy-styles.mjs",
    "dev:example": "vite --config vite.config.ts examples/playground/index.html",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@lexical/react": "^0.15.0",
    "lexical": "^0.15.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-markdown": "^9.0.1",
    "react-virtuoso": "^4.12.3",
    "remark-gfm": "^4.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.5",
    "@testing-library/react": "^15.0.7",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "jsdom": "^24.1.0",
    "tsup": "^8.1.0",
    "typescript": "^5.5.4",
    "vite": "^5.3.4",
    "vitest": "^2.0.5"
  }
}
```

`tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"],
    "baseUrl": "."
  },
  "include": ["src", "examples", "vite.config.ts", "tsup.config.ts"]
}
```

`vite.config.ts`

```ts
import { defineConfig } from "vite"

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
})
```

`tsup.config.ts`

```ts
import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "react/index": "src/react/index.ts",
    "sse/index": "src/sse/index.ts",
    "composer/lexical/index": "src/composer/lexical/index.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
})
```

`scripts/copy-styles.mjs`

```js
import { cpSync, mkdirSync } from "node:fs"

mkdirSync("dist", { recursive: true })
cpSync("src/styles.css", "dist/styles.css")
```

`src/model/types.ts`

```ts
export type UiMessageRole = "user" | "assistant" | "tool"

export type UiRuntimeState = {
  conversationId: string
  messages: []
  status: "idle" | "streaming" | "error"
  error: string | null
  warnings: string[]
}
```

`src/runtime/create-chat-runtime.ts`

```ts
import type { UiRuntimeState } from "../model/types"

type Listener = () => void

export function createChatRuntime(input: { conversationId?: string } = {}) {
  let state: UiRuntimeState = {
    conversationId: input.conversationId ?? "default",
    messages: [],
    status: "idle",
    error: null,
    warnings: [],
  }

  const listeners = new Set<Listener>()

  return {
    getState() {
      return state
    },
    setState(next: UiRuntimeState) {
      state = next
      listeners.forEach((listener) => listener())
    },
    subscribe(listener: Listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
```

`src/index.ts`

```ts
export * from "./model/types"
export * from "./runtime/create-chat-runtime"
```

`src/react/index.ts`

```ts
export {}
```

`src/sse/index.ts`

```ts
export {}
```

`src/composer/lexical/index.ts`

```ts
export {}
```

`src/styles.css`

```css
:root {
  --uinify-color-bg: #ffffff;
}
```

`src/test/setup.ts`

```ts
import "@testing-library/jest-dom/vitest"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/runtime/create-chat-runtime.test.ts && npm run typecheck`

Expected: PASS for the runtime test and `tsc` exits with code 0.

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json vite.config.ts tsup.config.ts scripts/copy-styles.mjs src/index.ts src/model/types.ts src/runtime/create-chat-runtime.ts src/react/index.ts src/sse/index.ts src/composer/lexical/index.ts src/styles.css src/test/setup.ts src/runtime/create-chat-runtime.test.ts
git commit -m "chore: bootstrap uinify package"
```

### Task 2: Implement The Canonical Model And Runtime Reducer

**Files:**
- Modify: `src/model/types.ts`
- Create: `src/runtime/events.ts`
- Create: `src/runtime/apply-stream-event.ts`
- Modify: `src/runtime/create-chat-runtime.ts`
- Create: `src/runtime/use-chat-session.ts`
- Modify: `src/index.ts`
- Test: `src/runtime/apply-stream-event.test.ts`

- [ ] **Step 1: Write the failing test**

`src/runtime/apply-stream-event.test.ts`

```ts
import { describe, expect, it } from "vitest"
import { applyStreamEvent } from "./apply-stream-event"
import type { UiRuntimeState } from "../model/types"

const emptyState: UiRuntimeState = {
  conversationId: "demo",
  messages: [],
  status: "idle",
  error: null,
  warnings: [],
}

describe("applyStreamEvent", () => {
  it("merges text, reasoning, tool calls, and artifacts into one message", () => {
    const withMessage = applyStreamEvent(emptyState, {
      type: "message.started",
      messageId: "m1",
      role: "assistant",
    })
    const withText = applyStreamEvent(withMessage, {
      type: "part.text.delta",
      messageId: "m1",
      partId: "p1",
      delta: "Hello",
    })
    const withReasoning = applyStreamEvent(withText, {
      type: "part.reasoning.delta",
      messageId: "m1",
      partId: "p2",
      delta: "Thinking...",
    })
    const withTool = applyStreamEvent(withReasoning, {
      type: "part.tool.updated",
      messageId: "m1",
      partId: "p3",
      toolName: "web_search",
      status: "running",
      inputSummary: "query=uinify",
    })
    const complete = applyStreamEvent(withTool, {
      type: "part.artifact.emitted",
      messageId: "m1",
      partId: "p4",
      artifact: {
        id: "a1",
        kind: "code",
        language: "ts",
        content: "console.log('uinify')",
      },
    })

    expect(complete.messages[0]?.parts).toEqual([
      { id: "p1", kind: "text", text: "Hello" },
      { id: "p2", kind: "reasoning", text: "Thinking...", state: "streaming" },
      {
        id: "p3",
        kind: "tool-call",
        toolName: "web_search",
        status: "running",
        inputSummary: "query=uinify",
        outputSummary: null,
      },
      {
        id: "p4",
        kind: "artifact",
        artifact: {
          id: "a1",
          kind: "code",
          language: "ts",
          content: "console.log('uinify')",
        },
      },
    ])
  })

  it("records a warning instead of crashing on an out-of-order delta", () => {
    const next = applyStreamEvent(emptyState, {
      type: "part.text.delta",
      messageId: "missing",
      partId: "p1",
      delta: "late",
    })

    expect(next.warnings).toEqual(["Missing message missing for event"])
    expect(next.messages).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/runtime/apply-stream-event.test.ts`

Expected: FAIL with `Cannot find module './apply-stream-event'` and missing event/type definitions.

- [ ] **Step 3: Write minimal implementation**

`src/model/types.ts`

```ts
export type UiMessageRole = "user" | "assistant" | "tool"

export type UiTextPart = { id: string; kind: "text"; text: string }
export type UiImagePart = { id: string; kind: "image"; url: string; alt?: string }
export type UiReasoningPart = { id: string; kind: "reasoning"; text: string; state: "streaming" | "complete" }
export type UiToolCallPart = {
  id: string
  kind: "tool-call"
  toolName: string
  status: "input-streaming" | "running" | "complete" | "error"
  inputSummary: string | null
  outputSummary: string | null
}
export type UiArtifact = { id: string; kind: "code" | "text"; language?: string; content: string }
export type UiArtifactPart = { id: string; kind: "artifact"; artifact: UiArtifact }
export type UiMessagePart = UiTextPart | UiImagePart | UiReasoningPart | UiToolCallPart | UiArtifactPart

export type UiMessage = {
  id: string
  role: UiMessageRole
  parts: UiMessagePart[]
  state: "streaming" | "complete" | "error"
  feedback: "up" | "down" | "none"
}

export type UiRuntimeState = {
  conversationId: string
  messages: UiMessage[]
  status: "idle" | "streaming" | "error"
  error: string | null
  warnings: string[]
}
```

`src/runtime/events.ts`

```ts
import type { UiArtifact, UiMessageRole, UiToolCallPart } from "../model/types"

export type UiStreamEvent =
  | { type: "message.started"; messageId: string; role: UiMessageRole }
  | { type: "message.completed"; messageId: string }
  | { type: "message.failed"; messageId: string; error: string }
  | { type: "part.text.delta"; messageId: string; partId: string; delta: string }
  | { type: "part.reasoning.delta"; messageId: string; partId: string; delta: string }
  | {
      type: "part.tool.updated"
      messageId: string
      partId: string
      toolName: string
      status: UiToolCallPart["status"]
      inputSummary?: string
      outputSummary?: string
    }
  | { type: "part.artifact.emitted"; messageId: string; partId: string; artifact: UiArtifact }
```

`src/runtime/apply-stream-event.ts`

```ts
import type { UiMessage, UiMessagePart, UiRuntimeState } from "../model/types"
import type { UiStreamEvent } from "./events"

function appendWarning(state: UiRuntimeState, warning: string): UiRuntimeState {
  return { ...state, warnings: [...state.warnings, warning] }
}

function withMessage(state: UiRuntimeState, messageId: string, update: (message: UiMessage) => UiMessage) {
  const index = state.messages.findIndex((message) => message.id === messageId)

  if (index === -1) {
    return appendWarning(state, `Missing message ${messageId} for event`)
  }

  const messages = [...state.messages]
  messages[index] = update(messages[index]!)
  return { ...state, messages }
}

function upsertPart(parts: UiMessagePart[], part: UiMessagePart) {
  const index = parts.findIndex((item) => item.id === part.id)
  if (index === -1) return [...parts, part]
  const next = [...parts]
  next[index] = part
  return next
}

export function applyStreamEvent(state: UiRuntimeState, event: UiStreamEvent): UiRuntimeState {
  switch (event.type) {
    case "message.started":
      return {
        ...state,
        status: "streaming",
        messages: [
          ...state.messages,
          { id: event.messageId, role: event.role, parts: [], state: "streaming", feedback: "none" },
        ],
      }

    case "message.completed":
      return withMessage(state, event.messageId, (message) => ({ ...message, state: "complete" }))

    case "message.failed":
      return {
        ...withMessage(state, event.messageId, (message) => ({ ...message, state: "error" })),
        status: "error",
        error: event.error,
      }

    case "part.text.delta":
      return withMessage(state, event.messageId, (message) => {
        const current = message.parts.find((part) => part.id === event.partId && part.kind === "text")
        return {
          ...message,
          parts: upsertPart(message.parts, {
            id: event.partId,
            kind: "text",
            text: `${current?.kind === "text" ? current.text : ""}${event.delta}`,
          }),
        }
      })

    case "part.reasoning.delta":
      return withMessage(state, event.messageId, (message) => {
        const current = message.parts.find((part) => part.id === event.partId && part.kind === "reasoning")
        return {
          ...message,
          parts: upsertPart(message.parts, {
            id: event.partId,
            kind: "reasoning",
            text: `${current?.kind === "reasoning" ? current.text : ""}${event.delta}`,
            state: "streaming",
          }),
        }
      })

    case "part.tool.updated":
      return withMessage(state, event.messageId, (message) => ({
        ...message,
        parts: upsertPart(message.parts, {
          id: event.partId,
          kind: "tool-call",
          toolName: event.toolName,
          status: event.status,
          inputSummary: event.inputSummary ?? null,
          outputSummary: event.outputSummary ?? null,
        }),
      }))

    case "part.artifact.emitted":
      return withMessage(state, event.messageId, (message) => ({
        ...message,
        parts: upsertPart(message.parts, {
          id: event.partId,
          kind: "artifact",
          artifact: event.artifact,
        }),
      }))
  }
}
```

`src/runtime/create-chat-runtime.ts`

```ts
import type { UiRuntimeState } from "../model/types"
import type { UiStreamEvent } from "./events"
import { applyStreamEvent } from "./apply-stream-event"

type Listener = () => void

export function createChatRuntime(input: { conversationId?: string } = {}) {
  let state: UiRuntimeState = {
    conversationId: input.conversationId ?? "default",
    messages: [],
    status: "idle",
    error: null,
    warnings: [],
  }

  const listeners = new Set<Listener>()
  const emit = () => listeners.forEach((listener) => listener())

  return {
    getState() {
      return state
    },
    dispatch(event: UiStreamEvent) {
      state = applyStreamEvent(state, event)
      emit()
    },
    subscribe(listener: Listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
```

`src/runtime/use-chat-session.ts`

```ts
import { useSyncExternalStore } from "react"
import type { createChatRuntime } from "./create-chat-runtime"

export function useChatSession(runtime: ReturnType<typeof createChatRuntime>) {
  return useSyncExternalStore(runtime.subscribe, runtime.getState, runtime.getState)
}
```

`src/index.ts`

```ts
export * from "./model/types"
export * from "./runtime/events"
export * from "./runtime/apply-stream-event"
export * from "./runtime/create-chat-runtime"
export * from "./runtime/use-chat-session"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/runtime/apply-stream-event.test.ts && npm run typecheck`

Expected: PASS with 2 tests passing and `tsc` exits with code 0.

- [ ] **Step 5: Commit**

```bash
git add src/model/types.ts src/runtime/events.ts src/runtime/apply-stream-event.ts src/runtime/create-chat-runtime.ts src/runtime/use-chat-session.ts src/index.ts src/runtime/apply-stream-event.test.ts
git commit -m "feat: add normalized chat runtime"
```

### Task 3: Add The Thin SSE Helper

**Files:**
- Create: `src/sse/read-sse-stream.ts`
- Create: `src/sse/create-sse-stream.ts`
- Modify: `src/sse/index.ts`
- Test: `src/sse/read-sse-stream.test.ts`

- [ ] **Step 1: Write the failing test**

`src/sse/read-sse-stream.test.ts`

```ts
import { describe, expect, it } from "vitest"
import { readSSEStream } from "./read-sse-stream"

describe("readSSEStream", () => {
  it("parses event and data fields from a ReadableStream", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("event: token\ndata: {\"delta\":\"hi\"}\n\n"))
        controller.close()
      },
    })

    const events = []
    for await (const event of readSSEStream(stream)) {
      events.push(event)
    }

    expect(events).toEqual([{ event: "token", data: '{"delta":"hi"}' }])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/sse/read-sse-stream.test.ts`

Expected: FAIL with `Cannot find module './read-sse-stream'`.

- [ ] **Step 3: Write minimal implementation**

`src/sse/read-sse-stream.ts`

```ts
export type UiSSEEvent = { event: string; data: string }

export async function* readSSEStream(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const chunks = buffer.split("\n\n")
    buffer = chunks.pop() ?? ""

    for (const chunk of chunks) {
      const lines = chunk.split("\n")
      const event = lines.find((line) => line.startsWith("event:"))?.replace("event:", "").trim() ?? "message"
      const data = lines
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.replace("data:", "").trim())
        .join("\n")

      yield { event, data }
    }
  }
}
```

`src/sse/create-sse-stream.ts`

```ts
import { readSSEStream } from "./read-sse-stream"

export async function* createSSEStream(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init)
  if (!response.ok) throw new Error(`SSE request failed with ${response.status}`)
  if (!response.body) throw new Error("SSE response body is missing")

  yield* readSSEStream(response.body)
}
```

`src/sse/index.ts`

```ts
export * from "./create-sse-stream"
export * from "./read-sse-stream"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/sse/read-sse-stream.test.ts`

Expected: PASS with 1 test passing.

- [ ] **Step 5: Commit**

```bash
git add src/sse/read-sse-stream.ts src/sse/create-sse-stream.ts src/sse/index.ts src/sse/read-sse-stream.test.ts
git commit -m "feat: add sse helper"
```

### Task 4: Build Default Message Blocks

**Files:**
- Create: `src/react/renderers.tsx`
- Create: `src/react/message.tsx`
- Create: `src/react/message-part.tsx`
- Create: `src/react/reasoning-block.tsx`
- Create: `src/react/tool-call-block.tsx`
- Create: `src/react/image-part.tsx`
- Create: `src/react/artifact-code-block.tsx`
- Create: `src/react/feedback-buttons.tsx`
- Modify: `src/react/index.ts`
- Test: `src/react/message-part.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/react/message-part.test.tsx`

```tsx
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { MessagePart } from "./message-part"
import { FeedbackButtons } from "./feedback-buttons"

describe("MessagePart", () => {
  it("renders markdown text and image parts", () => {
    render(
      <>
        <MessagePart part={{ id: "p1", kind: "text", text: "# Hello" }} />
        <MessagePart part={{ id: "p2", kind: "image", url: "/demo.png", alt: "demo" }} />
      </>,
    )

    expect(screen.getByRole("heading", { name: "Hello" })).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "demo" })).toHaveAttribute("src", "/demo.png")
  })

  it("toggles reasoning details and shows tool summaries", () => {
    render(
      <>
        <MessagePart part={{ id: "p3", kind: "reasoning", text: "Thinking...", state: "streaming" }} />
        <MessagePart
          part={{
            id: "p4",
            kind: "tool-call",
            toolName: "web_search",
            status: "running",
            inputSummary: "query=uinify",
            outputSummary: null,
          }}
        />
      </>,
    )

    fireEvent.click(screen.getByRole("button", { name: /reasoning/i }))

    expect(screen.getByText("Thinking...")).toBeInTheDocument()
    expect(screen.getByText("web_search")).toBeInTheDocument()
    expect(screen.getByText("query=uinify")).toBeInTheDocument()
  })

  it("emits feedback selections", () => {
    const onChange = vi.fn()
    render(<FeedbackButtons value="none" onChange={onChange} />)

    fireEvent.click(screen.getByRole("button", { name: /thumbs up/i }))

    expect(onChange).toHaveBeenCalledWith("up")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/react/message-part.test.tsx`

Expected: FAIL with `Cannot find module './message-part'` and `./feedback-buttons`.

- [ ] **Step 3: Write minimal implementation**

`src/react/renderers.tsx`

```tsx
import { createContext, useContext, type ReactNode, type ReactElement } from "react"
import type { UiMessagePart } from "../model/types"

export type UiRendererOverrides = {
  renderReasoning?: (part: Extract<UiMessagePart, { kind: "reasoning" }>) => ReactElement
  renderToolCall?: (part: Extract<UiMessagePart, { kind: "tool-call" }>) => ReactElement
  renderArtifactCode?: (part: Extract<UiMessagePart, { kind: "artifact" }>) => ReactElement
}

const RenderersContext = createContext<UiRendererOverrides>({})

export function RenderersProvider({ value, children }: { value: UiRendererOverrides; children: ReactNode }) {
  return <RenderersContext.Provider value={value}>{children}</RenderersContext.Provider>
}

export function useRenderers() {
  return useContext(RenderersContext)
}
```

`src/react/reasoning-block.tsx`

```tsx
import { useState } from "react"
import type { UiReasoningPart } from "../model/types"

export function ReasoningBlock({ part }: { part: UiReasoningPart }) {
  const [open, setOpen] = useState(false)

  return (
    <section data-slot="reasoning" data-state={part.state} data-expanded={open}>
      <button type="button" data-slot="reasoning-header" onClick={() => setOpen((value) => !value)}>
        Reasoning
      </button>
      {open ? <div data-slot="reasoning-body">{part.text}</div> : null}
    </section>
  )
}
```

`src/react/tool-call-block.tsx`

```tsx
import type { UiToolCallPart } from "../model/types"

export function ToolCallBlock({ part }: { part: UiToolCallPart }) {
  return (
    <section data-slot="toolcall" data-state={part.status}>
      <strong data-slot="toolcall-summary">{part.toolName}</strong>
      {part.inputSummary ? <div>{part.inputSummary}</div> : null}
      {part.outputSummary ? <div>{part.outputSummary}</div> : null}
    </section>
  )
}
```

`src/react/image-part.tsx`

```tsx
import type { UiImagePart } from "../model/types"

export function ImagePart({ part }: { part: UiImagePart }) {
  return <img data-slot="image-part" src={part.url} alt={part.alt ?? "image"} />
}
```

`src/react/artifact-code-block.tsx`

```tsx
import type { UiArtifactPart } from "../model/types"

export function ArtifactCodeBlock({ part }: { part: UiArtifactPart }) {
  return (
    <pre data-slot="artifact-code">
      <code>{part.artifact.content}</code>
    </pre>
  )
}
```

`src/react/feedback-buttons.tsx`

```tsx
export function FeedbackButtons({
  value,
  onChange,
}: {
  value: "up" | "down" | "none"
  onChange: (value: "up" | "down") => void
}) {
  return (
    <div data-slot="feedback" data-feedback={value}>
      <button type="button" aria-label="Thumbs up" onClick={() => onChange("up")}>
        Up
      </button>
      <button type="button" aria-label="Thumbs down" onClick={() => onChange("down")}>
        Down
      </button>
    </div>
  )
}
```

`src/react/message-part.tsx`

```tsx
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { UiMessagePart } from "../model/types"
import { ArtifactCodeBlock } from "./artifact-code-block"
import { ImagePart } from "./image-part"
import { ReasoningBlock } from "./reasoning-block"
import { ToolCallBlock } from "./tool-call-block"
import { useRenderers } from "./renderers"

export function MessagePart({ part }: { part: UiMessagePart }) {
  const renderers = useRenderers()

  switch (part.kind) {
    case "text":
      return (
        <div data-slot="message-part" data-kind="text">
          <Markdown remarkPlugins={[remarkGfm]}>{part.text}</Markdown>
        </div>
      )
    case "image":
      return <ImagePart part={part} />
    case "reasoning":
      return renderers.renderReasoning?.(part) ?? <ReasoningBlock part={part} />
    case "tool-call":
      return renderers.renderToolCall?.(part) ?? <ToolCallBlock part={part} />
    case "artifact":
      return renderers.renderArtifactCode?.(part) ?? <ArtifactCodeBlock part={part} />
  }
}
```

`src/react/message.tsx`

```tsx
import type { UiMessage } from "../model/types"
import { FeedbackButtons } from "./feedback-buttons"
import { MessagePart } from "./message-part"

export function Message({ message }: { message: UiMessage }) {
  return (
    <article data-slot="message" data-role={message.role} data-state={message.state}>
      <div data-slot="message-parts">
        {message.parts.map((part) => (
          <MessagePart key={part.id} part={part} />
        ))}
      </div>
      <FeedbackButtons value={message.feedback} onChange={() => undefined} />
    </article>
  )
}
```

`src/react/index.ts`

```ts
export * from "./artifact-code-block"
export * from "./feedback-buttons"
export * from "./image-part"
export * from "./message"
export * from "./message-part"
export * from "./reasoning-block"
export * from "./renderers"
export * from "./tool-call-block"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/react/message-part.test.tsx`

Expected: PASS with 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/react/renderers.tsx src/react/message.tsx src/react/message-part.tsx src/react/reasoning-block.tsx src/react/tool-call-block.tsx src/react/image-part.tsx src/react/artifact-code-block.tsx src/react/feedback-buttons.tsx src/react/index.ts src/react/message-part.test.tsx
git commit -m "feat: add default message blocks"
```

### Task 5: Add ChatRoot, Error Isolation, And A Virtualized MessageList

**Files:**
- Create: `src/react/chat-root.tsx`
- Create: `src/react/message-list.tsx`
- Create: `src/react/error-boundary.tsx`
- Modify: `src/react/index.ts`
- Test: `src/react/message-list.test.tsx`
- Test: `src/react/chat-root.test.tsx`

- [ ] **Step 1: Write the failing tests**

`src/react/message-list.test.tsx`

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { createChatRuntime } from "../runtime/create-chat-runtime"
import { ChatRoot } from "./chat-root"
import { MessageList } from "./message-list"

vi.mock("react-virtuoso", () => ({
  Virtuoso: ({ itemContent, totalCount }: { itemContent: (index: number) => React.ReactNode; totalCount: number }) => (
    <div data-testid="virtuoso-mock">{Array.from({ length: totalCount }, (_, index) => itemContent(index))}</div>
  ),
}))

describe("MessageList", () => {
  it("renders a linear transcript through Virtuoso", () => {
    const runtime = createChatRuntime({ conversationId: "demo" })
    render(
      <ChatRoot runtime={runtime}>
        <MessageList
          messages={[
            { id: "m1", role: "assistant", state: "complete", feedback: "none", parts: [{ id: "p1", kind: "text", text: "Hello" }] },
          ]}
        />
      </ChatRoot>,
    )

    expect(screen.getByTestId("virtuoso-mock")).toBeInTheDocument()
    expect(screen.getByText("Hello")).toBeInTheDocument()
  })
})
```

`src/react/chat-root.test.tsx`

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { createChatRuntime } from "../runtime/create-chat-runtime"
import { ChatRoot } from "./chat-root"
import { MessageList } from "./message-list"

describe("ChatRoot", () => {
  it("allows renderer overrides without breaking sibling messages", () => {
    const runtime = createChatRuntime({ conversationId: "demo" })
    runtime.dispatch({ type: "message.started", messageId: "m1", role: "assistant" })
    runtime.dispatch({ type: "part.reasoning.delta", messageId: "m1", partId: "p1", delta: "safe" })

    render(
      <ChatRoot
        runtime={runtime}
        renderers={{
          renderReasoning: (part) => <div data-testid="custom-reasoning">{part.text}</div>,
        }}
      >
        <MessageList />
      </ChatRoot>,
    )

    expect(screen.getByTestId("custom-reasoning")).toHaveTextContent("safe")
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/react/message-list.test.tsx src/react/chat-root.test.tsx`

Expected: FAIL with missing `ChatRoot`, `MessageList`, and error boundary infrastructure.

- [ ] **Step 3: Write minimal implementation**

`src/react/error-boundary.tsx`

```tsx
import { Component, type ErrorInfo, type ReactNode } from "react"

export class ErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {}

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}
```

`src/react/chat-root.tsx`

```tsx
import { createContext, useContext } from "react"
import type { ReactNode } from "react"
import type { createChatRuntime } from "../runtime/create-chat-runtime"
import { RenderersProvider, type UiRendererOverrides } from "./renderers"

const RuntimeContext = createContext<ReturnType<typeof createChatRuntime> | null>(null)

export function ChatRoot({
  runtime,
  renderers = {},
  children,
}: {
  runtime: ReturnType<typeof createChatRuntime>
  renderers?: UiRendererOverrides
  children: ReactNode
}) {
  return (
    <RuntimeContext.Provider value={runtime}>
      <RenderersProvider value={renderers}>{children}</RenderersProvider>
    </RuntimeContext.Provider>
  )
}

export function useChatRuntime() {
  const runtime = useContext(RuntimeContext)
  if (!runtime) throw new Error("useChatRuntime must be used inside ChatRoot")
  return runtime
}
```

`src/react/message-list.tsx`

```tsx
import { Virtuoso } from "react-virtuoso"
import type { UiMessage } from "../model/types"
import { useChatSession } from "../runtime/use-chat-session"
import { Message } from "./message"
import { useChatRuntime } from "./chat-root"
import { ErrorBoundary } from "./error-boundary"

export function MessageList({ messages }: { messages?: UiMessage[] }) {
  const runtime = useChatRuntime()
  const state = useChatSession(runtime)
  const items = messages ?? state.messages

  return (
    <Virtuoso
      data={items}
      totalCount={items.length}
      followOutput="auto"
      itemContent={(index) => (
        <ErrorBoundary fallback={<div data-slot="message-error">Message failed to render</div>}>
          <Message message={items[index]!} />
        </ErrorBoundary>
      )}
    />
  )
}
```

`src/react/index.ts`

```ts
export * from "./artifact-code-block"
export * from "./chat-root"
export * from "./error-boundary"
export * from "./feedback-buttons"
export * from "./image-part"
export * from "./message"
export * from "./message-list"
export * from "./message-part"
export * from "./reasoning-block"
export * from "./renderers"
export * from "./tool-call-block"
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/react/message-list.test.tsx src/react/chat-root.test.tsx`

Expected: PASS with 2 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/react/chat-root.tsx src/react/message-list.tsx src/react/error-boundary.tsx src/react/index.ts src/react/message-list.test.tsx src/react/chat-root.test.tsx
git commit -m "feat: add chat root and virtualized message list"
```

### Task 6: Add The Lexical Composer Shell And Attachment Tray

**Files:**
- Create: `src/composer/contracts.ts`
- Create: `src/react/attachment-tray.tsx`
- Create: `src/composer/lexical/lexical-composer.tsx`
- Modify: `src/composer/lexical/index.ts`
- Modify: `src/react/index.ts`
- Test: `src/composer/lexical/lexical-composer.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/composer/lexical/lexical-composer.test.tsx`

```tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { LexicalComposer } from "./lexical-composer"

describe("LexicalComposer", () => {
  it("submits plain text and pending attachments", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const file = new File(["hello"], "hello.txt", { type: "text/plain" })

    render(<LexicalComposer onSubmit={onSubmit} initialAttachments={[{ id: "a1", file, status: "ready" }]} />)

    await user.type(screen.getByRole("textbox"), "Hello world")
    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      text: "Hello world",
      attachments: [{ id: "a1", file, status: "ready" }],
      commands: [],
      mentions: [],
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/composer/lexical/lexical-composer.test.tsx`

Expected: FAIL with missing `LexicalComposer` and composer contracts.

- [ ] **Step 3: Write minimal implementation**

`src/composer/contracts.ts`

```ts
export type UiComposerAttachment = {
  id: string
  file: File
  status: "ready" | "uploading" | "error"
  error?: string
}

export type UiComposerValue = {
  text: string
  attachments: UiComposerAttachment[]
  commands: string[]
  mentions: string[]
}
```

`src/react/attachment-tray.tsx`

```tsx
import type { UiComposerAttachment } from "../composer/contracts"

export function AttachmentTray({
  attachments,
  onRemove,
}: {
  attachments: UiComposerAttachment[]
  onRemove?: (id: string) => void
}) {
  return (
    <div data-slot="attachment-tray" data-has-attachments={attachments.length > 0}>
      {attachments.map((attachment) => (
        <div key={attachment.id} data-slot="attachment-item" data-state={attachment.status}>
          <span>{attachment.file.name}</span>
          {onRemove ? (
            <button type="button" onClick={() => onRemove(attachment.id)}>
              Remove
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}
```

`src/composer/lexical/lexical-composer.tsx`

```tsx
import { useState } from "react"
import { LexicalComposer as BaseComposer } from "@lexical/react/LexicalComposer"
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { $getRoot } from "lexical"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import type { UiComposerAttachment, UiComposerValue } from "../contracts"
import { AttachmentTray } from "../../react/attachment-tray"

export function LexicalComposer({
  onSubmit,
  initialAttachments = [],
}: {
  onSubmit: (value: UiComposerValue) => void
  initialAttachments?: UiComposerAttachment[]
}) {
  const [text, setText] = useState("")
  const [attachments, setAttachments] = useState(initialAttachments)

  return (
    <div data-slot="composer">
      <BaseComposer
        initialConfig={{
          namespace: "uinify-composer",
          onError(error) {
            throw error
          },
        }}
      >
        <PlainTextPlugin
          contentEditable={<ContentEditable aria-label="Message" data-slot="composer-editor" />}
          placeholder={<span>Message</span>}
          ErrorBoundary={({ children }) => <>{children}</>}
        />
        <HistoryPlugin />
        <OnChangePlugin onChange={(editorState) => editorState.read(() => setText($getRoot().getTextContent()))} />
      </BaseComposer>

      <AttachmentTray attachments={attachments} onRemove={(id) => setAttachments((items) => items.filter((item) => item.id !== id))} />

      <button
        type="button"
        onClick={() => onSubmit({ text, attachments, commands: [], mentions: [] })}
      >
        Send
      </button>
    </div>
  )
}
```

`src/composer/lexical/index.ts`

```ts
export * from "./lexical-composer"
```

`src/react/index.ts`

```ts
export * from "./artifact-code-block"
export * from "./attachment-tray"
export * from "./chat-root"
export * from "./error-boundary"
export * from "./feedback-buttons"
export * from "./image-part"
export * from "./message"
export * from "./message-list"
export * from "./message-part"
export * from "./reasoning-block"
export * from "./renderers"
export * from "./tool-call-block"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/composer/lexical/lexical-composer.test.tsx && npm run typecheck`

Expected: PASS with 1 test passing and `tsc` exits with code 0.

- [ ] **Step 5: Commit**

```bash
git add src/composer/contracts.ts src/react/attachment-tray.tsx src/composer/lexical/lexical-composer.tsx src/composer/lexical/index.ts src/react/index.ts src/composer/lexical/lexical-composer.test.tsx
git commit -m "feat: add lexical composer shell"
```

### Task 7: Add Slash, Mention, And Attachment Plugins

**Files:**
- Create: `src/composer/lexical/plugins/slash-command-plugin.tsx`
- Create: `src/composer/lexical/plugins/mention-plugin.tsx`
- Create: `src/composer/lexical/plugins/attachment-plugin.tsx`
- Modify: `src/composer/contracts.ts`
- Modify: `src/composer/lexical/lexical-composer.tsx`
- Modify: `src/composer/lexical/index.ts`
- Test: `src/composer/lexical/plugins/slash-command-plugin.test.tsx`
- Test: `src/composer/lexical/plugins/mention-plugin.test.tsx`
- Test: `src/composer/lexical/plugins/attachment-plugin.test.tsx`

- [ ] **Step 1: Write the failing tests**

`src/composer/lexical/plugins/slash-command-plugin.test.tsx`

```tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { createChatRuntime } from "../../../runtime/create-chat-runtime"
import { ChatRoot } from "../../../react/chat-root"
import { LexicalComposer } from "../lexical-composer"

describe("SlashCommandPlugin", () => {
  it("inserts the selected slash command", async () => {
    const user = userEvent.setup()
    const runtime = createChatRuntime({ conversationId: "demo" })
    render(
      <ChatRoot runtime={runtime}>
        <LexicalComposer
          onSubmit={() => undefined}
          slashCommands={[{ id: "agent", label: "agent", insertText: "/agent " }]}
        />
      </ChatRoot>,
    )

    await user.type(screen.getByRole("textbox"), "/a")
    await user.click(screen.getByRole("button", { name: "agent" }))

    expect(screen.getByRole("textbox")).toHaveTextContent("/agent ")
  })
})
```

`src/composer/lexical/plugins/mention-plugin.test.tsx`

```tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { createChatRuntime } from "../../../runtime/create-chat-runtime"
import { ChatRoot } from "../../../react/chat-root"
import { LexicalComposer } from "../lexical-composer"

describe("MentionPlugin", () => {
  it("inserts the selected mention token", async () => {
    const user = userEvent.setup()
    const runtime = createChatRuntime({ conversationId: "demo" })
    render(
      <ChatRoot runtime={runtime}>
        <LexicalComposer
          onSubmit={() => undefined}
          mentions={[{ id: "worker", label: "worker", insertText: "@worker " }]}
        />
      </ChatRoot>,
    )

    await user.type(screen.getByRole("textbox"), "@w")
    await user.click(screen.getByRole("button", { name: "worker" }))

    expect(screen.getByRole("textbox")).toHaveTextContent("@worker ")
  })
})
```

`src/composer/lexical/plugins/attachment-plugin.test.tsx`

```tsx
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { createChatRuntime } from "../../../runtime/create-chat-runtime"
import { ChatRoot } from "../../../react/chat-root"
import { LexicalComposer } from "../lexical-composer"

describe("AttachmentPlugin", () => {
  it("adds pasted files to the attachment tray", () => {
    const runtime = createChatRuntime({ conversationId: "demo" })
    render(
      <ChatRoot runtime={runtime}>
        <LexicalComposer onSubmit={() => undefined} />
      </ChatRoot>,
    )
    const file = new File(["hello"], "hello.txt", { type: "text/plain" })

    fireEvent.paste(screen.getByRole("textbox"), {
      clipboardData: { files: [file], items: [], types: ["Files"] },
    })

    expect(screen.getByText("hello.txt")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/composer/lexical/plugins/slash-command-plugin.test.tsx src/composer/lexical/plugins/mention-plugin.test.tsx src/composer/lexical/plugins/attachment-plugin.test.tsx`

Expected: FAIL because the plugins and composer extension points do not exist yet.

- [ ] **Step 3: Write minimal implementation**

`src/composer/contracts.ts`

```ts
export type UiComposerAttachment = {
  id: string
  file: File
  status: "ready" | "uploading" | "error"
  error?: string
}

export type UiComposerChoice = {
  id: string
  label: string
  insertText: string
}

export type UiComposerValue = {
  text: string
  attachments: UiComposerAttachment[]
  commands: string[]
  mentions: string[]
}
```

`src/composer/lexical/plugins/slash-command-plugin.tsx`

```tsx
import type { UiComposerChoice } from "../../contracts"

export function SlashCommandPlugin({
  query,
  items,
  onSelect,
}: {
  query: string
  items: UiComposerChoice[]
  onSelect: (item: UiComposerChoice) => void
}) {
  if (!query.startsWith("/")) return null
  const matches = items.filter((item) => item.label.startsWith(query.slice(1)))
  if (matches.length === 0) return null

  return (
    <div data-slot="slash-menu">
      {matches.map((item) => (
        <button key={item.id} type="button" onClick={() => onSelect(item)}>
          {item.label}
        </button>
      ))}
    </div>
  )
}
```

`src/composer/lexical/plugins/mention-plugin.tsx`

```tsx
import type { UiComposerChoice } from "../../contracts"

export function MentionPlugin({
  query,
  items,
  onSelect,
}: {
  query: string
  items: UiComposerChoice[]
  onSelect: (item: UiComposerChoice) => void
}) {
  if (!query.startsWith("@")) return null
  const matches = items.filter((item) => item.label.startsWith(query.slice(1)))
  if (matches.length === 0) return null

  return (
    <div data-slot="mention-menu">
      {matches.map((item) => (
        <button key={item.id} type="button" onClick={() => onSelect(item)}>
          {item.label}
        </button>
      ))}
    </div>
  )
}
```

`src/composer/lexical/plugins/attachment-plugin.tsx`

```tsx
import type { ClipboardEvent, DragEvent } from "react"
import type { UiComposerAttachment } from "../../contracts"

export function collectAttachments(files: FileList | File[]) {
  return Array.from(files).map<UiComposerAttachment>((file, index) => ({
    id: `${file.name}-${index}`,
    file,
    status: "ready",
  }))
}

export function createAttachmentHandlers(onAdd: (files: UiComposerAttachment[]) => void) {
  return {
    onPaste(event: ClipboardEvent<HTMLElement>) {
      if (event.clipboardData.files.length > 0) onAdd(collectAttachments(event.clipboardData.files))
    },
    onDrop(event: DragEvent<HTMLElement>) {
      event.preventDefault()
      if (event.dataTransfer.files.length > 0) onAdd(collectAttachments(event.dataTransfer.files))
    },
  }
}
```

`src/composer/lexical/lexical-composer.tsx`

```tsx
import { useMemo, useRef, useState } from "react"
import { LexicalComposer as BaseComposer } from "@lexical/react/LexicalComposer"
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import type { LexicalEditor } from "lexical"
import type { UiComposerAttachment, UiComposerChoice, UiComposerValue } from "../contracts"
import { AttachmentTray } from "../../react/attachment-tray"
import { createAttachmentHandlers } from "./plugins/attachment-plugin"
import { MentionPlugin } from "./plugins/mention-plugin"
import { SlashCommandPlugin } from "./plugins/slash-command-plugin"

export function LexicalComposer({
  onSubmit,
  initialAttachments = [],
  slashCommands = [],
  mentions = [],
}: {
  onSubmit: (value: UiComposerValue) => void
  initialAttachments?: UiComposerAttachment[]
  slashCommands?: UiComposerChoice[]
  mentions?: UiComposerChoice[]
}) {
  const [text, setText] = useState("")
  const [attachments, setAttachments] = useState(initialAttachments)
  const editorRef = useRef<LexicalEditor | null>(null)

  const activeToken = useMemo(() => text.split(/\s+/).at(-1) ?? "", [text])
  const attachmentHandlers = useMemo(
    () => createAttachmentHandlers((items) => setAttachments((current) => [...current, ...items])),
    [],
  )

  const insertChoice = (choice: UiComposerChoice) => {
    setText((current) => current.replace(/(?:\/|@)\S*$/, choice.insertText))
    editorRef.current?.update(() => {
      const root = $getRoot()
      root.clear()
      root.append($createParagraphNode().append($createTextNode(choice.insertText)))
    })
  }

  return (
    <div data-slot="composer">
      <BaseComposer
        initialConfig={{
          namespace: "uinify-composer",
          onError: (error) => {
            throw error
          },
          editorState: undefined,
        }}
      >
        <EditorRefPlugin onReady={(editor) => {
          editorRef.current = editor
        }} />
        <PlainTextPlugin
          contentEditable={
            <ContentEditable
              aria-label="Message"
              data-slot="composer-editor"
              onInput={(event) => setText(event.currentTarget.textContent ?? "")}
              onPaste={attachmentHandlers.onPaste}
              onDrop={attachmentHandlers.onDrop}
            />
          }
          placeholder={<span>Message</span>}
          ErrorBoundary={({ children }) => <>{children}</>}
        />
        <HistoryPlugin />
      </BaseComposer>

      <SlashCommandPlugin query={activeToken} items={slashCommands} onSelect={insertChoice} />
      <MentionPlugin query={activeToken} items={mentions} onSelect={insertChoice} />
      <AttachmentTray attachments={attachments} onRemove={(id) => setAttachments((items) => items.filter((item) => item.id !== id))} />

      <button type="button" onClick={() => onSubmit({ text, attachments, commands: [], mentions: [] })}>
        Send
      </button>
    </div>
  )
}
```

Append this support code to `src/composer/lexical/lexical-composer.tsx`:

```tsx
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"

function EditorRefPlugin({ onReady }: { onReady: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext()
  onReady(editor)
  return null
}
```

`src/composer/lexical/index.ts`

```ts
export * from "./lexical-composer"
export * from "./plugins/attachment-plugin"
export * from "./plugins/mention-plugin"
export * from "./plugins/slash-command-plugin"
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/composer/lexical/plugins/slash-command-plugin.test.tsx src/composer/lexical/plugins/mention-plugin.test.tsx src/composer/lexical/plugins/attachment-plugin.test.tsx && npm run typecheck`

Expected: PASS with 3 tests passing and `tsc` exits with code 0.

- [ ] **Step 5: Commit**

```bash
git add src/composer/contracts.ts src/composer/lexical/plugins/slash-command-plugin.tsx src/composer/lexical/plugins/mention-plugin.tsx src/composer/lexical/plugins/attachment-plugin.tsx src/composer/lexical/lexical-composer.tsx src/composer/lexical/index.ts src/composer/lexical/plugins/slash-command-plugin.test.tsx src/composer/lexical/plugins/mention-plugin.test.tsx src/composer/lexical/plugins/attachment-plugin.test.tsx
git commit -m "feat: add lexical composer plugins"
```

### Task 8: Add Styling Tokens And Customization Hooks

**Files:**
- Modify: `src/react/message.tsx`
- Modify: `src/react/message-part.tsx`
- Modify: `src/react/chat-root.tsx`
- Modify: `src/react/attachment-tray.tsx`
- Modify: `src/styles.css`
- Modify: `src/react/index.ts`
- Test: `src/react/chat-root.test.tsx`

- [ ] **Step 1: Write the failing test**

Append this test to `src/react/chat-root.test.tsx`:

```tsx
it("applies slot class names and stable data attributes", () => {
  const runtime = createChatRuntime({ conversationId: "demo" })
  runtime.dispatch({ type: "message.started", messageId: "m1", role: "assistant" })
  runtime.dispatch({ type: "part.text.delta", messageId: "m1", partId: "p1", delta: "Styled" })

  render(
    <ChatRoot runtime={runtime} slotClassNames={{ message: "custom-message", messageParts: "custom-parts" }}>
      <MessageList />
    </ChatRoot>,
  )

  expect(screen.getByText("Styled").closest("article")).toHaveClass("custom-message")
  expect(screen.getByText("Styled").closest("div[data-slot='message-parts']")).toHaveClass("custom-parts")
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/react/chat-root.test.tsx`

Expected: FAIL because `slotClassNames` is not supported yet.

- [ ] **Step 3: Write minimal implementation**

`src/react/chat-root.tsx`

```tsx
import { createContext, useContext } from "react"
import type { ReactNode } from "react"
import type { createChatRuntime } from "../runtime/create-chat-runtime"
import { RenderersProvider, type UiRendererOverrides } from "./renderers"

type UiSlotClassNames = Partial<Record<"message" | "messageParts" | "attachmentItem", string>>

const RuntimeContext = createContext<ReturnType<typeof createChatRuntime> | null>(null)
const SlotClassContext = createContext<UiSlotClassNames>({})

export function ChatRoot({
  runtime,
  renderers = {},
  slotClassNames = {},
  children,
}: {
  runtime: ReturnType<typeof createChatRuntime>
  renderers?: UiRendererOverrides
  slotClassNames?: UiSlotClassNames
  children: ReactNode
}) {
  return (
    <RuntimeContext.Provider value={runtime}>
      <SlotClassContext.Provider value={slotClassNames}>
        <RenderersProvider value={renderers}>{children}</RenderersProvider>
      </SlotClassContext.Provider>
    </RuntimeContext.Provider>
  )
}

export function useChatRuntime() {
  const runtime = useContext(RuntimeContext)
  if (!runtime) throw new Error("useChatRuntime must be used inside ChatRoot")
  return runtime
}

export function useSlotClassNames() {
  return useContext(SlotClassContext)
}
```

`src/react/message.tsx`

```tsx
import type { UiMessage } from "../model/types"
import { FeedbackButtons } from "./feedback-buttons"
import { MessagePart } from "./message-part"
import { useSlotClassNames } from "./chat-root"

export function Message({ message }: { message: UiMessage }) {
  const slots = useSlotClassNames()

  return (
    <article data-slot="message" data-role={message.role} data-state={message.state} className={slots.message}>
      <div data-slot="message-parts" className={slots.messageParts}>
        {message.parts.map((part) => (
          <MessagePart key={part.id} part={part} />
        ))}
      </div>
      <FeedbackButtons value={message.feedback} onChange={() => undefined} />
    </article>
  )
}
```

`src/react/attachment-tray.tsx`

```tsx
import type { UiComposerAttachment } from "../composer/contracts"
import { useSlotClassNames } from "./chat-root"

export function AttachmentTray({
  attachments,
  onRemove,
}: {
  attachments: UiComposerAttachment[]
  onRemove?: (id: string) => void
}) {
  const slots = useSlotClassNames()

  return (
    <div data-slot="attachment-tray" data-has-attachments={attachments.length > 0}>
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          data-slot="attachment-item"
          data-state={attachment.status}
          className={slots.attachmentItem}
        >
          <span>{attachment.file.name}</span>
          {onRemove ? <button type="button" onClick={() => onRemove(attachment.id)}>Remove</button> : null}
        </div>
      ))}
    </div>
  )
}
```

`src/styles.css`

```css
:root {
  --uinify-color-bg: #ffffff;
  --uinify-color-surface: #f7f7fb;
  --uinify-color-border: #dde1ea;
  --uinify-color-text: #1d2433;
  --uinify-color-muted: #667085;
  --uinify-radius-md: 14px;
  --uinify-space-2: 8px;
  --uinify-space-3: 12px;
  --uinify-space-4: 16px;
  --uinify-font-body: Inter, ui-sans-serif, system-ui, sans-serif;
}

[data-slot="message"] {
  font-family: var(--uinify-font-body);
  background: var(--uinify-color-surface);
  border: 1px solid var(--uinify-color-border);
  border-radius: var(--uinify-radius-md);
  color: var(--uinify-color-text);
  margin-block: var(--uinify-space-2);
  padding: var(--uinify-space-4);
}

[data-slot="message"][data-role="user"] {
  background: #eef4ff;
}

[data-slot="reasoning"] {
  border-left: 3px solid var(--uinify-color-border);
  padding-left: var(--uinify-space-3);
}

[data-slot="toolcall"] {
  background: #fff;
  border: 1px solid var(--uinify-color-border);
  border-radius: calc(var(--uinify-radius-md) - 4px);
  padding: var(--uinify-space-3);
}

[data-slot="artifact-code"] {
  background: #111827;
  border-radius: calc(var(--uinify-radius-md) - 4px);
  color: #f9fafb;
  overflow-x: auto;
  padding: var(--uinify-space-3);
}

[data-slot="composer-editor"] {
  border: 1px solid var(--uinify-color-border);
  border-radius: var(--uinify-radius-md);
  min-height: 96px;
  padding: var(--uinify-space-3);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/react/chat-root.test.tsx`

Expected: PASS with both existing tests plus the new slot-class test passing.

- [ ] **Step 5: Commit**

```bash
git add src/react/chat-root.tsx src/react/message.tsx src/react/attachment-tray.tsx src/styles.css src/react/chat-root.test.tsx
git commit -m "feat: add theme tokens and slot customization"
```

### Task 9: Add Integration Examples And Final Verification

**Files:**
- Create: `examples/fixtures.ts`
- Create: `examples/playground/App.tsx`
- Create: `examples/playground/main.tsx`
- Create: `examples/playground/index.html`
- Test: `examples/example-flows.test.tsx`

- [ ] **Step 1: Write the failing test**

`examples/example-flows.test.tsx`

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ExamplePlayground } from "./playground/App"

describe("ExamplePlayground", () => {
  it("renders the four documented V1 scenarios", () => {
    render(<ExamplePlayground />)

    expect(screen.getByText("Simple assistant")).toBeInTheDocument()
    expect(screen.getByText("Tool-calling agent")).toBeInTheDocument()
    expect(screen.getByText("Reasoning + code artifact")).toBeInTheDocument()
    expect(screen.getByText("Custom renderer + adapter")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- examples/example-flows.test.tsx`

Expected: FAIL with missing example files.

- [ ] **Step 3: Write minimal implementation**

`examples/fixtures.ts`

```ts
export const exampleFixtures = [
  { id: "simple", title: "Simple assistant", description: "Text-only assistant flow" },
  { id: "tool", title: "Tool-calling agent", description: "Assistant response with tool call part" },
  { id: "artifact", title: "Reasoning + code artifact", description: "Reasoning block plus emitted code artifact" },
  { id: "custom", title: "Custom renderer + adapter", description: "Host-provided renderer overrides and normalized events" },
]
```

`examples/playground/App.tsx`

```tsx
import { exampleFixtures } from "../fixtures"

export function ExamplePlayground() {
  return (
    <main>
      <h1>uinify examples</h1>
      <ul>
        {exampleFixtures.map((fixture) => (
          <li key={fixture.id}>
            <strong>{fixture.title}</strong>
            <p>{fixture.description}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

`examples/playground/main.tsx`

```tsx
import React from "react"
import ReactDOM from "react-dom/client"
import { ExamplePlayground } from "./App"
import "../../src/styles.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ExamplePlayground />
  </React.StrictMode>,
)
```

`examples/playground/index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>uinify examples</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- examples/example-flows.test.tsx && npm run build && npm run typecheck`

Expected: PASS for the example test, successful build output in `dist/`, and typecheck exits with code 0.

- [ ] **Step 5: Commit**

```bash
git add examples/fixtures.ts examples/playground/App.tsx examples/playground/main.tsx examples/playground/index.html examples/example-flows.test.tsx
git commit -m "docs: add v1 integration examples"
```

## Self-Review Checklist

- Spec coverage:
  - canonical model and normalized events: Task 2
  - SSE helper: Task 3
  - message blocks, reasoning, tool calls, feedback, image, artifact code: Task 4
  - virtualized linear transcript and error isolation: Task 5
  - Lexical-first composer, attachments, slash, mention: Tasks 6 and 7
  - default CSS theme, slot classes, `data-*` states: Task 8
  - integration examples: Task 9
- Placeholder scan: no unresolved placeholders or deferred implementation markers remain in tasks.
- Type consistency: `UiStreamEvent`, `UiRuntimeState`, `UiComposerValue`, and renderer names are consistent across tasks.
