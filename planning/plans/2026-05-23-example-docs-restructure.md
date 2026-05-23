# Example And Docs Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the playground run from `pnpm dev:example`, separate runnable examples from example-only tests, move internal planning material out of `docs/`, and raise the user-facing docs to a usable first-adoption baseline.

**Architecture:** Add a dedicated Vite config for the playground, keep the library test config separate, move example fixtures/tests into a clearer tree, turn the playground into a lightweight example hub, and reshape `docs/` into user-facing guides while moving internal roadmap material into `planning/`.

**Tech Stack:** TypeScript, React, Vite, Vitest, Testing Library, Markdown docs

---

## File Map

### Create

- `vite.example.config.ts`
- `examples/fixtures/index.ts`
- `examples/tests/example-vite-config.test.ts`
- `examples/tests/example-flows.test.tsx`
- `examples/tests/fixtures.test.ts`
- `examples/tests/templates.test.tsx`
- `examples/tests/reference-mappers.test.ts`
- `examples/tests/repository-layout.test.ts`
- `examples/playground/playground.css`
- `docs/guides/core-concepts.md`
- `docs/guides/examples.md`
- `docs/integration/sse.md`
- `docs/components/message-list.md`
- `docs/components/composer-lexical.md`
- `docs/styling/theming.md`
- `docs/styling/slots.md`

### Modify

- `package.json`
- `examples/playground/App.tsx`
- `examples/playground/main.tsx`
- `README.md`
- `docs/getting-started.md`
- `docs/integration/stream-mapping.md`
- `docs/integration/upload-lifecycle.md`
- `docs/advanced/artifact-renderers.md`
- `docs/advanced/stability.md`

### Move

- `examples/fixtures.ts` -> `examples/fixtures/index.ts`
- `examples/example-flows.test.tsx` -> `examples/tests/example-flows.test.tsx`
- `examples/fixtures.test.ts` -> `examples/tests/fixtures.test.ts`
- `examples/templates/templates.test.tsx` -> `examples/tests/templates.test.tsx`
- `examples/adapters/reference-mappers.test.ts` -> `examples/tests/reference-mappers.test.ts`
- `docs/superpowers/specs/*` -> `planning/specs/`
- `docs/superpowers/plans/*` -> `planning/plans/`

### Keep As-Is

- `vite.config.ts` remains the Vitest config surface
- `examples/templates/*` remain the copyable template examples
- `examples/adapters/*` remain reference-only integration samples

### Verification Targets

- `pnpm test -- examples/tests/example-vite-config.test.ts`
- `pnpm test -- examples/tests/example-flows.test.tsx`
- `pnpm test -- examples/tests/fixtures.test.ts`
- `pnpm test -- examples/tests/templates.test.tsx`
- `pnpm test -- examples/tests/reference-mappers.test.ts`
- `pnpm test -- examples/tests/repository-layout.test.ts`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build:example`
- `pnpm dev:example`

### Task 1: Add A Dedicated Playground Vite Entry

**Files:**
- Create: `vite.example.config.ts`
- Create: `examples/tests/example-vite-config.test.ts`
- Modify: `package.json`
- Test: `examples/tests/example-vite-config.test.ts`

- [ ] **Step 1: Write the failing config test**

Create `examples/tests/example-vite-config.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import exampleViteConfig from "../../vite.example.config"

describe("example vite config", () => {
  it("uses the playground as the explicit dev and build entry", () => {
    expect(String(exampleViteConfig.root)).toContain("examples/playground")
    expect(String(exampleViteConfig.build?.outDir)).toContain("examples/playground/dist-example")
    expect(String(exampleViteConfig.build?.rollupOptions?.input)).toContain("examples/playground/index.html")
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- examples/tests/example-vite-config.test.ts`

Expected: FAIL because `../../vite.example.config` does not exist yet.

- [ ] **Step 3: Add the dedicated playground Vite config and wire the scripts**

Create `vite.example.config.ts`:

```ts
import { resolve } from "node:path"
import { defineConfig } from "vite"

const playgroundRoot = resolve(__dirname, "examples/playground")

export default defineConfig({
  root: playgroundRoot,
  publicDir: false,
  build: {
    outDir: resolve(playgroundRoot, "dist-example"),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(playgroundRoot, "index.html"),
    },
  },
})
```

Update the `scripts` block in `package.json`:

```json
{
  "scripts": {
    "build": "tsup --config tsup.config.ts && node scripts/copy-styles.mjs",
    "build:example": "vite build --config vite.example.config.ts",
    "dev:example": "vite --config vite.example.config.ts",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 4: Run the focused config test again**

Run: `pnpm test -- examples/tests/example-vite-config.test.ts`

Expected: PASS.

- [ ] **Step 5: Verify the playground build and dev entry manually**

Run: `pnpm build:example`

Expected: PASS and emit files into `examples/playground/dist-example/`.

Run: `pnpm dev:example`

Expected: the Vite server opens `http://localhost:5173/` and the root path serves the playground HTML instead of a missing-page experience.

- [ ] **Step 6: Commit the entrypoint change**

Run:

```bash
git add package.json vite.example.config.ts examples/tests/example-vite-config.test.ts
git commit -m "fix: add dedicated example vite entry"
```

### Task 2: Reorganize Example Fixtures And Example-Focused Tests

**Files:**
- Create: `examples/fixtures/index.ts`
- Create: `examples/tests/example-flows.test.tsx`
- Create: `examples/tests/fixtures.test.ts`
- Create: `examples/tests/templates.test.tsx`
- Create: `examples/tests/reference-mappers.test.ts`
- Modify: `examples/playground/App.tsx`
- Move: `examples/fixtures.ts`, `examples/example-flows.test.tsx`, `examples/fixtures.test.ts`, `examples/templates/templates.test.tsx`, `examples/adapters/reference-mappers.test.ts`
- Test: `examples/tests/fixtures.test.ts`, `examples/tests/templates.test.tsx`, `examples/tests/reference-mappers.test.ts`, `examples/tests/example-flows.test.tsx`

- [ ] **Step 1: Move one example test first so the path break is visible**

Run:

```bash
mkdir -p examples/tests && git mv examples/fixtures.test.ts examples/tests/fixtures.test.ts
```

- [ ] **Step 2: Run the moved test and confirm the import path failure**

Run: `pnpm test -- examples/tests/fixtures.test.ts`

Expected: FAIL with a module-resolution error because the test still imports from the old relative paths.

- [ ] **Step 3: Move the fixtures module into a dedicated directory barrel**

Run:

```bash
mkdir -p examples/fixtures && git mv examples/fixtures.ts examples/fixtures/index.ts
```

Keep the exported contents the same in `examples/fixtures/index.ts` so the runtime fixtures, template metadata, and helper remain stable.

Update the playground import in `examples/playground/App.tsx`:

```ts
import { exampleTemplateSections, type ExampleTemplate } from "../fixtures"
```

Update the moved fixtures test import in `examples/tests/fixtures.test.ts`:

```ts
import { mapAgentLikeEvent } from "../adapters/agent-like"
import { customAgentLikeFixture } from "../adapters/protocol-fixtures"
import { exampleFixtureSections, exampleFixtures } from "../fixtures"
```

- [ ] **Step 4: Move the remaining example-only tests and update their imports**

Run:

```bash
git mv examples/example-flows.test.tsx examples/tests/example-flows.test.tsx
git mv examples/templates/templates.test.tsx examples/tests/templates.test.tsx
git mv examples/adapters/reference-mappers.test.ts examples/tests/reference-mappers.test.ts
```

Update `examples/tests/example-flows.test.tsx`:

```ts
import { ExamplePlayground } from "../playground/App"
```

Update `examples/tests/templates.test.tsx`:

```ts
import { AdapterTemplate } from "../templates/adapter-template"
import { ArtifactTemplate } from "../templates/artifact-template"
import { MinimalAppTemplate } from "../templates/minimal-app"
import { UploadTemplate } from "../templates/upload-template"
```

Update `examples/tests/reference-mappers.test.ts`:

```ts
import { createChatRuntime, type UiStreamEvent } from "../../src"
import { adaptAgentLikeEvent, mapAgentLikeEvent, type AgentLikeEvent } from "../adapters/agent-like"
import { adaptCustomMinimalEvent, mapCustomMinimalEvent } from "../adapters/custom-minimal"
import { agentLikeFixture, customMinimalFixture, openAiLikeFixture } from "../adapters/protocol-fixtures"
import { adaptOpenAiLikeChunk, mapOpenAiLikeChunk } from "../adapters/openai-like"
```

- [ ] **Step 5: Run the reorganized example tests**

Run: `pnpm test -- examples/tests/fixtures.test.ts examples/tests/templates.test.tsx examples/tests/reference-mappers.test.ts examples/tests/example-flows.test.tsx`

Expected: PASS with the moved tests reading from `examples/fixtures/`, `examples/templates/`, `examples/adapters/`, and `examples/playground/`.

- [ ] **Step 6: Commit the example tree cleanup**

Run:

```bash
git add examples/fixtures/index.ts examples/playground/App.tsx examples/tests
git commit -m "refactor: reorganize example support files"
```

### Task 3: Turn The Playground Into A Lightweight Example Hub

**Files:**
- Modify: `examples/playground/App.tsx`
- Modify: `examples/playground/main.tsx`
- Create: `examples/playground/playground.css`
- Modify: `examples/tests/example-flows.test.tsx`
- Test: `examples/tests/example-flows.test.tsx`

- [ ] **Step 1: Rewrite the playground test around a single selected preview**

Replace `examples/tests/example-flows.test.tsx` with:

```tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { ExamplePlayground } from "../playground/App"

vi.mock("react-virtuoso", () => ({
  Virtuoso: ({
    data,
    itemContent,
  }: {
    data: unknown[]
    itemContent: (index: number, item?: unknown) => React.ReactNode
  }) => (
    <div>
      {data.map((item, index) => (
        <div key={index}>{itemContent(index, item)}</div>
      ))}
    </div>
  ),
}))

describe("ExamplePlayground", () => {
  it("shows one selected template preview at a time", async () => {
    const user = userEvent.setup()

    render(<ExamplePlayground />)

    expect(screen.getByRole("button", { name: "Minimal app template" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("link", { name: "Read docs" })).toHaveAttribute("href", "docs/getting-started.md")
    expect(screen.queryByText("const customized = true")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Artifact customization template" }))

    expect(screen.getByRole("button", { name: "Artifact customization template" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("link", { name: "Read docs" })).toHaveAttribute("href", "docs/advanced/artifact-renderers.md")
    expect(screen.getByText("const customized = true")).toBeInTheDocument()
    expect(screen.queryByText(/No adapter diagnostics for this transcript\./i)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the playground test to verify it fails against the stacked-page implementation**

Run: `pnpm test -- examples/tests/example-flows.test.tsx`

Expected: FAIL because the current playground renders all templates at once and does not expose a selected state.

- [ ] **Step 3: Implement the example hub UI and its local styles**

Update `examples/playground/App.tsx`:

```tsx
import { useMemo, useState } from "react"
import { exampleTemplateSections, type ExampleTemplate } from "../fixtures"
import { AdapterTemplate } from "../templates/adapter-template"
import { ArtifactTemplate } from "../templates/artifact-template"
import { MinimalAppTemplate } from "../templates/minimal-app"
import { UploadTemplate } from "../templates/upload-template"

const templateRegistry = {
  minimal: MinimalAppTemplate,
  adapter: AdapterTemplate,
  upload: UploadTemplate,
  artifact: ArtifactTemplate,
} satisfies Record<ExampleTemplate["id"], () => React.JSX.Element>

const templates = exampleTemplateSections.flatMap((section) => section.templates)

export function ExamplePlayground() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<ExampleTemplate["id"]>(templates[0].id)

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? templates[0],
    [selectedTemplateId],
  )

  const SelectedTemplate = templateRegistry[selectedTemplate.id]

  return (
    <main className="playground-shell">
      <header className="playground-header">
        <p className="playground-kicker">uinify</p>
        <h1>Example Playground</h1>
        <p>Browse the supported integration shapes, then jump to the matching guide.</p>
      </header>

      <div className="playground-layout">
        <aside className="playground-sidebar" aria-label="Example templates">
          {exampleTemplateSections.map((section) => (
            <section key={section.id} className="playground-section">
              <h2>{section.title}</h2>
              <div className="playground-template-list">
                {section.templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className="playground-template-button"
                    aria-pressed={template.id === selectedTemplate.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                  >
                    <span>{template.title}</span>
                    <small>{template.description}</small>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </aside>

        <section className="playground-preview">
          <div className="playground-preview-header">
            <div>
              <h2>{selectedTemplate.title}</h2>
              <p>{selectedTemplate.description}</p>
            </div>
            <a href={selectedTemplate.docsPath}>Read docs</a>
          </div>

          <div className="playground-preview-body">
            <SelectedTemplate />
          </div>
        </section>
      </div>
    </main>
  )
}
```

Create `examples/playground/playground.css`:

```css
:root {
  color: #e5e7eb;
  background: #0f172a;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

body {
  margin: 0;
  background: linear-gradient(180deg, #020617 0%, #111827 100%);
}

#root {
  min-height: 100vh;
}

.playground-shell {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 32px;
}

.playground-header {
  margin: 0 auto 24px;
  max-width: 1280px;
}

.playground-kicker {
  margin: 0 0 8px;
  color: #93c5fd;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.playground-layout {
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  margin: 0 auto;
  max-width: 1280px;
}

.playground-sidebar,
.playground-preview {
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 20px;
  background: rgba(15, 23, 42, 0.78);
  backdrop-filter: blur(14px);
}

.playground-sidebar {
  padding: 20px;
}

.playground-section + .playground-section {
  margin-top: 20px;
}

.playground-template-list {
  display: grid;
  gap: 12px;
}

.playground-template-button {
  display: grid;
  gap: 6px;
  width: 100%;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  color: inherit;
  background: rgba(30, 41, 59, 0.7);
  text-align: left;
}

.playground-template-button[aria-pressed="true"] {
  border-color: rgba(96, 165, 250, 0.7);
  background: rgba(30, 64, 175, 0.35);
}

.playground-preview {
  padding: 20px;
}

.playground-preview-header {
  display: flex;
  gap: 16px;
  align-items: start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.playground-preview-body {
  overflow: auto;
}

@media (max-width: 960px) {
  .playground-shell {
    padding: 20px;
  }

  .playground-layout {
    grid-template-columns: 1fr;
  }
}
```

Update `examples/playground/main.tsx`:

```tsx
import React from "react"
import ReactDOM from "react-dom/client"
import "../../src/styles.css"
import "./playground.css"
import { ExamplePlayground } from "./App"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ExamplePlayground />
  </React.StrictMode>,
)
```

- [ ] **Step 4: Run the updated playground test**

Run: `pnpm test -- examples/tests/example-flows.test.tsx`

Expected: PASS.

- [ ] **Step 5: Verify the hub in the browser**

Run: `pnpm dev:example`

Expected: the left-hand template index changes the selected preview, the docs link updates with the selection, and the layout stays usable on narrow widths.

- [ ] **Step 6: Commit the playground redesign**

Run:

```bash
git add examples/playground/App.tsx examples/playground/main.tsx examples/playground/playground.css examples/tests/example-flows.test.tsx
git commit -m "feat: turn playground into example hub"
```

### Task 4: Expand The Core User-Facing Guides

**Files:**
- Create: `docs/guides/core-concepts.md`
- Create: `docs/guides/examples.md`
- Create: `docs/integration/sse.md`
- Modify: `docs/getting-started.md`
- Modify: `docs/integration/stream-mapping.md`
- Modify: `docs/integration/upload-lifecycle.md`
- Modify: `docs/advanced/artifact-renderers.md`
- Modify: `docs/advanced/stability.md`
- Create: `examples/tests/repository-layout.test.ts`
- Test: `examples/tests/repository-layout.test.ts`

- [ ] **Step 1: Write a failing repository-layout test for the new core docs**

Create `examples/tests/repository-layout.test.ts`:

```ts
import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const repoPath = (...parts: string[]) => resolve(__dirname, "../..", ...parts)

describe("repository layout", () => {
  it("keeps the new core user-facing docs in docs/", () => {
    expect(existsSync(repoPath("docs/guides/core-concepts.md"))).toBe(true)
    expect(existsSync(repoPath("docs/guides/examples.md"))).toBe(true)
    expect(existsSync(repoPath("docs/integration/sse.md"))).toBe(true)
  })
})
```

- [ ] **Step 2: Run the layout test to verify it fails**

Run: `pnpm test -- examples/tests/repository-layout.test.ts`

Expected: FAIL because the new docs files do not exist yet.

- [ ] **Step 3: Add the core guides and refresh the existing integration pages**

Create `docs/guides/core-concepts.md`:

```md
# Core Concepts

`uinify` is a React-first chat UI foundation built around one rule: backend-specific data should be normalized before it reaches rendering.

## Mental Model

- Your host maps protocol events into `UiStreamEvent`.
- `createChatRuntime` turns those events into transcript state.
- `ChatRoot` and `MessageList` render the transcript.
- Host callbacks own retries, regeneration, feedback, uploads, and transport work.

## Canonical Runtime

The runtime is frontend-oriented. It does not know about OpenAI, agents, workflows, or SSE payload shapes. It only knows canonical message and part events.

## Message Parts

The built-in model supports text, reasoning, tool-call, artifact, image, and attachment parts.

## Extension Seams

- adapter helpers for protocol mapping
- renderer overrides for artifact and message-part presentation
- slot-based styling hooks
- Lexical composer hooks for attachments, mentions, and slash commands

## Recommended Adoption Path

If you are integrating for the first time, start with `createChatRuntime`, `UiStreamEvent`, `ChatRoot`, `MessageList`, and `uinify/styles.css`.
```

Create `docs/guides/examples.md`:

```md
# Examples Guide

`uinify` ships three kinds of example material.

## Playground

Run `pnpm dev:example` to browse the local playground. It is the fastest way to inspect the supported integration shapes.

## Templates

Files in `examples/templates/` are copyable starting points for real integrations:

- `minimal-app.tsx`
- `adapter-template.tsx`
- `upload-template.tsx`
- `artifact-template.tsx`

## Reference Adapters

Files in `examples/adapters/` are reference-only. They show protocol mapping patterns, but they are not versioned compatibility packages.

## Fixtures And Tests

`examples/fixtures/` and `examples/tests/` support the playground and the regression suite. They are useful for maintainers, but the normal adoption path starts with the templates and docs.
```

Create `docs/integration/sse.md`:

```md
# SSE Integration

Use `uinify/sse` when your host needs a lightweight helper for reading server-sent events.

## What The SSE Helper Does

- fetches or reads an SSE response stream
- yields parsed `{ event, data }` entries
- leaves protocol-to-`UiStreamEvent` mapping to your host

## Example

```ts
import { createSseStream } from "uinify/sse"

const stream = createSseStream(fetch("/api/chat/stream"))

for await (const entry of stream) {
  console.log(entry.event, entry.data)
}
```

## Boundary

The SSE helper is transport-level only. It does not dispatch into the runtime by itself.
```

Update `docs/getting-started.md`:

```md
# Getting Started

Start with the smallest possible setup: create a runtime, dispatch canonical stream events into it, and render messages with `ChatRoot` plus `MessageList`.

See the matching example template in `examples/templates/minimal-app.tsx` and the broader examples guide in `docs/guides/examples.md`.

For first-time adoption, the recommended default setup is to import `uinify/styles.css` once near your app entrypoint.

## Install

```bash
npm install uinify react react-dom
```

## Minimal Setup

```tsx
import { useEffect, useState } from "react"
import { createChatRuntime } from "uinify"
import { ChatRoot, MessageList } from "uinify/react"

export function App() {
  const [runtime] = useState(() => createChatRuntime({ conversationId: "demo" }))

  useEffect(() => {
    runtime.dispatch({ type: "message.started", messageId: "m1", role: "assistant" })
    runtime.dispatch({ type: "part.text.delta", messageId: "m1", partId: "p1", delta: "Hello from uinify." })
    runtime.dispatch({ type: "message.completed", messageId: "m1" })
  }, [runtime])

  return (
    <ChatRoot runtime={runtime}>
      <MessageList />
    </ChatRoot>
  )
}
```

## Next Steps

- `docs/guides/core-concepts.md`
- `docs/integration/stream-mapping.md`
- `docs/components/message-list.md`
- `docs/styling/theming.md`
```

Update `docs/integration/stream-mapping.md` to add the new cross-links:

```md
# Stream Mapping

Map your host or backend protocol into `UiStreamEvent` before it reaches the runtime. This keeps `uinify` focused on chat state and rendering instead of vendor-specific transport details.

See the matching example template in `examples/templates/adapter-template.tsx`, then compare it with `docs/integration/sse.md` if your transport arrives over server-sent events.

For first-time adoption, the recommended default setup is to import `uinify/styles.css` once near your app entrypoint.
```

Refresh the intros in `docs/integration/upload-lifecycle.md`, `docs/advanced/artifact-renderers.md`, and `docs/advanced/stability.md` so each page links back to the new guides rather than standing alone.

- [ ] **Step 4: Run the repository-layout test**

Run: `pnpm test -- examples/tests/repository-layout.test.ts`

Expected: PASS.

- [ ] **Step 5: Manually review the docs for first-adoption clarity**

Open and read:

```text
docs/getting-started.md
docs/guides/core-concepts.md
docs/guides/examples.md
docs/integration/stream-mapping.md
docs/integration/sse.md
```

Expected: a new engineer can discover the runtime, adapter boundary, templates, and SSE helper without reading source first.

- [ ] **Step 6: Commit the core docs pass**

Run:

```bash
git add docs/getting-started.md docs/guides docs/integration examples/tests/repository-layout.test.ts
git commit -m "docs: expand core adoption guides"
```

### Task 5: Add Component And Styling Docs And Move Internal Planning Material

**Files:**
- Create: `docs/components/message-list.md`
- Create: `docs/components/composer-lexical.md`
- Create: `docs/styling/theming.md`
- Create: `docs/styling/slots.md`
- Modify: `README.md`
- Modify: `examples/tests/repository-layout.test.ts`
- Move: `docs/superpowers/specs/*`, `docs/superpowers/plans/*`
- Test: `examples/tests/repository-layout.test.ts`

- [ ] **Step 1: Extend the repository-layout test with the remaining docs and planning constraints**

Update `examples/tests/repository-layout.test.ts`:

```ts
import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const repoPath = (...parts: string[]) => resolve(__dirname, "../..", ...parts)

describe("repository layout", () => {
  it("keeps the new core user-facing docs in docs/", () => {
    expect(existsSync(repoPath("docs/guides/core-concepts.md"))).toBe(true)
    expect(existsSync(repoPath("docs/guides/examples.md"))).toBe(true)
    expect(existsSync(repoPath("docs/integration/sse.md"))).toBe(true)
  })

  it("keeps component and styling docs in docs/", () => {
    expect(existsSync(repoPath("docs/components/message-list.md"))).toBe(true)
    expect(existsSync(repoPath("docs/components/composer-lexical.md"))).toBe(true)
    expect(existsSync(repoPath("docs/styling/theming.md"))).toBe(true)
    expect(existsSync(repoPath("docs/styling/slots.md"))).toBe(true)
  })

  it("moves internal planning material out of docs/", () => {
    expect(existsSync(repoPath("docs/superpowers"))).toBe(false)
    expect(existsSync(repoPath("planning/specs/2026-05-17-uinify-chat-ui-library-design.md"))).toBe(true)
    expect(existsSync(repoPath("planning/plans/2026-05-22-uinify-v0.3-example-app-templates.md"))).toBe(true)
  })
})
```

- [ ] **Step 2: Run the layout test to verify it fails before the move**

Run: `pnpm test -- examples/tests/repository-layout.test.ts`

Expected: FAIL because the component/styling docs and moved planning files do not all exist yet, and `docs/superpowers` still exists.

- [ ] **Step 3: Add the component/styling docs, update the README, and move the internal planning files**

Create `docs/components/message-list.md`:

```md
# Message List

`MessageList` is the default transcript renderer for `uinify/react`.

## Usage

```tsx
import { ChatRoot, MessageList } from "uinify/react"

<ChatRoot runtime={runtime}>
  <MessageList />
</ChatRoot>
```

## What It Renders

- ordered chat messages from the runtime
- default part rendering for text, reasoning, tool-call, artifact, image, and attachment parts
- message-level and part-level action surfaces when handlers are provided through `ChatRoot`

## Customize Carefully

Start with styling hooks and renderer overrides before replacing the whole transcript shell.
```

Create `docs/components/composer-lexical.md`:

```md
# Lexical Composer

`uinify/composer/lexical` provides a frontend-only composer surface for text entry, attachments, mentions, and slash commands.

## Exports

- `LexicalComposer`
- `collectAttachments`
- `createAttachmentHandlers`
- `MentionPlugin`
- `SlashCommandPlugin`

## Host-Owned Behavior

The composer does not upload files or submit network requests on its own. Your host owns attachments, retries, cancel intent, and submission side effects.

## Recommended Pattern

Use a controlled `attachments` array with `onAttachmentsChange`, then handle `onSubmit` by forwarding `UiComposerValue` into your app-specific transport.
```

Create `docs/styling/theming.md`:

```md
# Theming

Import `uinify/styles.css` once, then override the exposed `--uinify-*` custom properties in your own stylesheet.

## Pattern

```css
:root {
  --uinify-color-bg: #0f172a;
  --uinify-color-fg: #e5e7eb;
}
```

## Recommendation

Prefer token overrides first. Reach for renderer replacement only when the product shape needs to change, not just the colors or spacing.
```

Create `docs/styling/slots.md`:

```md
# Stable Slots

`uinify` exposes stable `data-slot` regions and matching `slotClassNames` keys for long-lived styling hooks.

## Common Slots

- `message`
- `message-parts`
- `message-actions`
- `part-actions`
- `artifact-container`
- `artifact-tabs`
- `artifact-views`
- `attachment-tray`
- `attachment-actions`
- `attachment-part`

## Recommendation

Treat documented slots as the stable styling contract. Do not style against incidental DOM nesting when a slot is already available.
```

Update the docs section in `README.md`:

```md
## Docs

- [Getting Started](./docs/getting-started.md)
- [Core Concepts](./docs/guides/core-concepts.md)
- [Examples Guide](./docs/guides/examples.md)
- [Stream Mapping](./docs/integration/stream-mapping.md)
- [SSE Integration](./docs/integration/sse.md)
- [Lexical Composer](./docs/components/composer-lexical.md)
- [Theming](./docs/styling/theming.md)
- [Stability Guide](./docs/advanced/stability.md)
```

Run the planning-file move:

```bash
mkdir -p planning/specs planning/plans
git mv docs/superpowers/specs/* planning/specs/
git mv docs/superpowers/plans/* planning/plans/
rmdir docs/superpowers/specs docs/superpowers/plans docs/superpowers
```

- [ ] **Step 4: Run the updated repository-layout test**

Run: `pnpm test -- examples/tests/repository-layout.test.ts`

Expected: PASS.

- [ ] **Step 5: Sanity-check the moved planning links and README navigation**

Run: `pnpm test -- examples/tests/fixtures.test.ts examples/tests/example-flows.test.tsx`

Expected: PASS, with example metadata still pointing at user-facing docs and the repository-layout test covering the planning move.

Open and read:

```text
README.md
docs/components/message-list.md
docs/components/composer-lexical.md
docs/styling/theming.md
docs/styling/slots.md
```

Expected: README now points at the richer docs tree, while `planning/` holds internal material.

- [ ] **Step 6: Commit the docs and planning restructure**

Run:

```bash
git add README.md docs/components docs/styling planning/specs planning/plans examples/tests/repository-layout.test.ts
git commit -m "docs: separate planning from user docs"
```

### Task 6: Run Full Verification And Fix Any Drift

**Files:**
- Modify: any files required by failing checks from previous tasks
- Test: full repo checks

- [ ] **Step 1: Run the focused example test suite**

Run:

```bash
pnpm test -- examples/tests/example-vite-config.test.ts examples/tests/example-flows.test.tsx examples/tests/fixtures.test.ts examples/tests/templates.test.tsx examples/tests/reference-mappers.test.ts examples/tests/repository-layout.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`

Expected: PASS.

- [ ] **Step 3: Run the full test suite**

Run: `pnpm test`

Expected: PASS.

- [ ] **Step 4: Run the example build**

Run: `pnpm build:example`

Expected: PASS.

- [ ] **Step 5: Run the example dev server one more time**

Run: `pnpm dev:example`

Expected: the root URL loads the playground, the template selection works, and the docs links point at the reorganized user-facing docs tree.

- [ ] **Step 6: Commit any verification fixes and summarize the final structure**

Run:

```bash
git add package.json vite.example.config.ts examples docs planning README.md
git commit -m "feat: stabilize examples and docs structure"
```

Final summary should mention:

- the dedicated example entrypoint
- the new `examples/tests/` and `examples/fixtures/` layout
- the new docs categories under `docs/`
- the planning move to `planning/`
- the exact verification commands that passed
