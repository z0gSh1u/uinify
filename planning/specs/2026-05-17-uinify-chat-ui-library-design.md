# Uinify Chat UI Library Design

## Summary

`uinify` is a React Chat UI component library for embedding high-quality chat experiences into existing web products without imposing a backend protocol, server component, or SaaS dependency. It is designed for LLM applications such as chatbots, agents, and workflow products that need consistent UI for conversation rendering, streaming updates, tool call visibility, reasoning display, attachments, and structured input interactions.

V1 will be headless-first with opinionated defaults:

- React DOM / web only
- backend-agnostic
- SSE-only streaming support
- canonical normalized message model
- runtime hooks for chat state and event merging
- default UI components with renderer override slots
- plain CSS default theme with CSS variables
- Lexical-first composer

The library will prioritize embedding into existing product pages rather than shipping a full chat application shell.

## Context

The current ecosystem has partial solutions, but most teams still rebuild chat UI from scratch because existing options usually fail on one or more of these axes:

- too tightly coupled to a single AI protocol or vendor
- require a backend service or framework-specific runtime
- offer weak customization despite being marketed as reusable UI
- provide primitives only, without a stable, high-quality default experience
- produce inconsistent behavior for streaming, tool calls, and long transcripts

OpenCode's Solid UI package is a strong reference for interaction quality and message rendering breadth, but it is coupled to its own SDK and data model. `uinify` should borrow interaction lessons from that implementation while deliberately separating transport, protocol, and UI contracts.

## Goals

- Provide a production-quality React chat UI library for existing products.
- Remain independent from any specific backend protocol or vendor.
- Offer a stable normalized model for messages, parts, reasoning blocks, tool calls, attachments, and artifacts.
- Provide runtime hooks that merge normalized streaming events into renderable chat state.
- Ship a high-quality default UI that can be customized without forking.
- Support the most common LLM chat surface needs in V1:
  - text messages
  - image messages
  - reasoning blocks
  - tool call display
  - file attachments in the composer
  - slash and at-trigger interactions
  - feedback actions
  - code and plain-text artifact preview
- Handle long transcripts well with built-in virtualization.

## Non-Goals

- No backend service, hosted control plane, or SaaS product.
- No Next.js, Vercel, or framework-specific coupling.
- No WebSocket support in V1.
- No voice input in V1.
- No full application shell in V1:
  - no sidebar
  - no session list
  - no full-page workspace layout
- No branch or tree-shaped conversation UI in V1.
- No complex artifact workbench beyond code and plain-text preview.
- No first-party protocol adapters as public API in V1.

## Product Shape

`uinify` will ship as a single npm package with subpath exports. Internally it should still maintain clear module boundaries, but externally users should have one package to install and a simple import story.

Expected public entry points:

- `uinify`
- `uinify/react`
- `uinify/composer/lexical`
- `uinify/sse`
- `uinify/styles.css`

This approach keeps the user mental model simple while allowing the implementation to isolate optional dependencies such as Lexical and the SSE helper.

## Architecture

V1 is organized into four layers.

### 1. Model Layer

Defines the canonical normalized types that all runtime and UI code consume.

Core entities:

- `UiConversation`
- `UiMessage`
- `UiMessagePart`
- `UiTextPart`
- `UiImagePart`
- `UiReasoningPart`
- `UiToolCallPart`
- `UiArtifact`
- `UiAttachment`
- `UiFeedbackState`

This model is the library's stable center. Adapters convert protocol-specific events into this shape before any runtime or UI logic runs.

### 2. Runtime Layer

Provides chat state hooks and reducers that consume normalized stream events and produce renderable state.

Responsibilities:

- create and hold linear transcript state
- merge text deltas into messages
- merge reasoning deltas into reasoning parts
- track tool call lifecycle changes
- attach artifacts and message completion state
- surface status and error state to UI

The runtime does not know about OpenAI, agent-specific payloads, or workflow node semantics. It only understands `UiStreamEvent` contracts.

### 3. UI Layer

Ships default React components for the supported chat surface. These components render canonical state and do not parse backend payloads.

### 4. Theme Layer

Ships plain CSS, CSS variables, stable slots, and `data-*` state attributes. Renderer overrides allow consumers to replace key blocks while keeping the rest of the system intact.

## Public API Design

The V1 public API should be grouped into five areas.

### Model and Events

Expose stable types for the canonical model and normalized stream events.

Representative exports:

- `UiConversation`
- `UiMessage`
- `UiMessagePart`
- `UiReasoningPart`
- `UiToolCallPart`
- `UiAttachment`
- `UiArtifact`
- `UiStreamEvent`

Representative runtime entry points:

- `createChatRuntime()`
- `applyStreamEvent()`
- `useChatSession()`

### SSE Helper

Provide a thin helper layer for teams that do not want to hand-roll `fetch + SSE parse`.

Representative exports:

- `createSSEStream()`
- `readSSEStream()`

This helper is intentionally limited to transport concerns:

- request execution
- SSE parsing
- abort handling
- reconnect hook points
- event emission

It must not embed protocol semantics.

### UI Components

Provide the default component set for the V1 surface area.

### Customization Surface

Expose stable customization mechanisms:

- `className`
- slot props
- `data-*` state attributes
- renderer overrides such as `renderToolCall`, `renderReasoning`, and `renderArtifactCode`

### Lexical Composer Entry

Keep the editor implementation behind a dedicated subpath so the rest of the library is not conceptually tied to Lexical.

Representative exports:

- `LexicalComposer`
- `SlashCommandPlugin`
- `MentionPlugin`
- `AttachmentPlugin`

## Data Flow

The library's core integration contract is a five-step pipeline.

1. The host application decides when to send messages and which backend endpoint to call.
2. The host may use `uinify/sse` to read the response stream, or use its own SSE client.
3. The host adapter converts backend protocol events into `UiStreamEvent` values.
4. The `uinify` runtime merges those normalized events into canonical chat state.
5. The UI components render canonical state only.

Representative event shapes include:

- message started
- text delta appended
- reasoning delta appended
- tool call started
- tool call arguments delta
- tool call completed
- artifact emitted
- message completed
- message failed

This boundary is what makes `uinify` backend-agnostic. The library owns state merging and UI behavior; the consumer owns protocol translation.

## Transcript Model

V1 will support a linear transcript only.

Constraints:

- a single message timeline per rendered conversation
- no retry branches
- no parent-child branch navigation
- no tree-shaped session visualization

This keeps the runtime deterministic and avoids prematurely complicating event merge semantics.

## Core Component Set

V1 should focus on embed-ready components, not a full-page chat product shell.

### `ChatRoot`

Provides runtime context, renderer overrides, and theme scope.

### `MessageList`

Provides transcript rendering, virtualization, and scroll behavior.

Implementation direction:

- built-in virtualization using `react-virtuoso`
- automatic bottom-stick behavior for active conversations
- non-disruptive behavior when the user scrolls upward
- resilience to dynamic height changes from streaming text, images, reasoning expansion, and tool details

### `Message`

Owns the outer container for one message, including role-aware layout, avatar slots, bubble container, and message-level actions.

### `MessagePart`

Dispatches by canonical part type into the relevant renderer.

### `ReasoningBlock`

Renders generic reasoning content with:

- fold and unfold behavior
- streaming append behavior
- in-progress and completed states

This block intentionally does not assume the payload is raw chain-of-thought. It is a generic reasoning UI primitive.

### `ToolCallBlock`

Shows:

- tool name
- lifecycle state
- arguments summary
- result summary
- expandable detail area

### `ImagePart`

Renders image content attached to a message.

### `ArtifactCodeBlock`

Supports V1 artifact preview for code and plain text only.

### `Composer`

Hosts the Lexical-based input experience, attachment tray, and send interaction.

### `AttachmentTray`

Shows pending files and upload-related state.

### `FeedbackButtons`

Provides thumbs-up and thumbs-down UI with external callbacks.

## Composer Design

The official V1 composer is Lexical-first, but the library must not let the editor implementation bleed into the canonical chat model.

Lexical is used to support the expected interaction quality for:

- slash commands
- at-trigger mentions
- structured input insertion
- attachment-aware editing UX
- future richer input extensions

The composer is split into five concerns.

### 1. Composer Shell

Owns layout and high-level interaction state:

- disabled
- submitting
- streaming
- attachment tray placement
- send action affordance

### 2. Lexical Editor Core

Owns:

- text editing
- selection
- placeholder
- enter and shift-enter behavior
- editor serialization

### 3. Slash Command Plugin

Owns:

- `/` trigger behavior
- candidate list
- keyboard navigation
- command insertion behavior

### 4. Mention Plugin

Owns:

- `@` trigger behavior
- candidate data source integration
- mention insertion behavior

### 5. Attachment Plugin

Owns:

- file selection
- drag and drop
- paste handling
- synchronization with `AttachmentTray`

The composer should output a practical V1 payload shape:

- plain text or markdown-like text
- structured command and mention tokens as needed
- attachment references

It should not force the rest of the system into a rich-text AST model.

## Styling and Customization

`uinify` is headless-first with opinionated defaults, not primitives-only.

That means:

- default UI should be directly usable
- DOM structure should be stable enough to style
- key renderers should be replaceable
- users should not need to fork the library to make meaningful visual changes

### Stable Slots

Representative slot structure:

- `message`
- `message-avatar`
- `message-bubble`
- `message-parts`
- `reasoning-header`
- `reasoning-body`
- `toolcall-summary`
- `toolcall-details`
- `composer-editor`
- `composer-toolbar`
- `attachment-item`

### `data-*` State Attributes

Representative state attributes:

- `data-role="user|assistant|tool"`
- `data-state="streaming|complete|error"`
- `data-expanded="true|false"`
- `data-feedback="up|down|none"`
- `data-has-attachments="true|false"`

### Theme Delivery

V1 default styling should ship as plain CSS with CSS variables for:

- colors
- spacing
- radii
- typography
- bubble surfaces
- code block visuals
- composer chrome

The default theme must not require Tailwind or a CSS-in-JS runtime.

### Renderer Overrides

Key replaceable renderers:

- `renderMessagePart`
- `renderReasoning`
- `renderToolCall`
- `renderArtifactCode`
- `renderFeedback`

This gives consumers a strong default path and a deep-customization path without making them rebuild the whole transcript.

## Error Handling

V1 should model failures explicitly instead of leaving them to ad hoc consumer behavior.

### Transport Errors

Examples:

- network failure
- aborted request
- SSE disconnect

Handling rules:

- runtime exposes clear error state
- UI renders error and retry hooks
- retry policy itself remains consumer-defined

### Normalization Errors

Examples:

- invalid event ordering
- malformed normalized events

Handling rules:

- development builds warn clearly
- runtime degrades locally where possible
- one malformed part should not crash the transcript

### Render-Time Errors

Examples:

- a custom renderer throws during render

Handling rules:

- local error boundaries protect key blocks
- unrelated messages continue rendering

### Composer and Attachment Errors

Examples:

- unsupported file type
- file too large
- upload failure

Handling rules:

- error state lives at the relevant attachment item or composer surface
- the entire composer should not become unusable from one failed attachment

## Testing Strategy

V1 needs four testing layers.

### 1. Model and Runtime Unit Tests

Focus on event merge correctness:

- text delta accumulation
- reasoning block accumulation
- tool call lifecycle transitions
- artifact emission
- message completion and failure
- invalid event sequence degradation

### 2. Component Tests

Focus on block-level rendering behavior:

- `MessagePart` dispatch
- `ReasoningBlock` collapse behavior
- `ToolCallBlock` expansion behavior
- `FeedbackButtons` state display
- `AttachmentTray` status rendering

### 3. Composer Interaction Tests

Focus on interactive editing behavior:

- slash trigger and selection
- mention trigger and insertion
- drag-and-drop attachments
- paste attachments
- enter and shift-enter handling

### 4. Integration Examples

Ship realistic examples for:

- a simple assistant
- a tool-calling agent
- reasoning plus code artifact output
- custom renderer and custom adapter integration

## Key Implementation Constraints For Planning

These constraints must remain fixed during implementation planning unless the product direction changes.

- React only
- web only
- CSR-first with SSR compatibility where practical
- SSE only
- linear transcript only
- single package with subpath exports
- canonical normalized model is mandatory
- official runtime consumes normalized events, not protocol payloads
- default UI is required, but key blocks must be overridable
- composer is Lexical-first
- virtualization is built in and should use `react-virtuoso`
- only generic adapter contracts are first-party API

## Open Questions Deferred Out Of V1

These topics may matter later, but they are intentionally not part of the first implementation plan:

- branch and retry-tree transcript support
- WebSocket transport support
- voice input
- richer artifact workbench experiences
- native or cross-platform rendering targets
- official protocol-specific adapters
- page-shell components such as sidebars and session lists

## Recommendation

Proceed with V1 as a headless system with opinionated defaults:

- stable canonical model
- normalized stream event contracts
- runtime hooks for state merge
- embedded-ready UI components
- plain CSS default theme
- Lexical-first composer
- virtualization built into the official message list

This gives `uinify` a clear position in the ecosystem: a reusable React chat UI foundation that is practical to adopt in real products without inheriting a backend or framework stack.
