# Chat Example Showcase Design

Date: 2026-06-13

## Context

The examples app has intentionally been narrowed to a single Vite route at `/chat`.
That page currently demonstrates a real OpenAI-compatible text-only streaming flow,
but it does not show the broader uinify surface: multimodal input, the Lexical
composer, attachment lifecycle, command menus, reasoning, tool steps, image parts,
artifact previews, action payloads, renderer overrides, or styling hooks.

The next iteration keeps the one-example strategy while making `/chat` a complete
product showcase.

## Goals

- Keep `/chat` as the only examples route.
- Demonstrate a real OpenAI-compatible multimodal chat flow against the configured
  model, including image understanding.
- Use the existing uinify `LexicalComposer` from `uinify/composer/lexical`; do not
  rebuild composer behavior inside the example.
- Add a deterministic UI surface gallery that visibly covers all important message
  parts and customization hooks without depending on provider-specific output.
- Strictly separate live chat code from gallery code at the folder level.
- Keep the dev-server OpenAI-compatible adapter reference-only and server-side.

## Non-Goals

- Do not restore multiple examples, templates, or a route switcher.
- Do not build a production file upload service.
- Do not treat `examples/server/openai-compatible-chat.ts` as a stable OpenAI
  compatibility layer.
- Do not require the model provider to emit reasoning, tools, or artifacts in a
  specific non-standard shape.
- Do not change the public uinify API unless implementation uncovers a concrete
  bug in the existing surface.

## Directory Layout

The example will use these boundaries:

```text
examples/src/chat/
  ChatExample.tsx
  chat.css
  live/
    LiveChatPanel.tsx
    live-chat-model.ts
    live-chat-request.ts
    live-chat-commands.ts
  gallery/
    SurfaceGalleryPanel.tsx
    gallery-messages.ts
    gallery-renderers.tsx
  shared/
    ids.ts
    files.ts
```

`ChatExample.tsx` is only page composition: header, live panel, and gallery panel.

`live/` owns the real model path: composer state, local user-message dispatch,
attachment handling, request creation, SSE reading, and runtime updates.

`gallery/` owns deterministic showcase fixtures and renderers. It never calls
`/api/chat` and does not depend on environment variables.

`shared/` contains only helpers that are genuinely reused by live and gallery code.
Helpers used by one side stay local to that side.

## Page Shape

The `/chat` page has two product surfaces:

1. Live multimodal chat: real model interaction using text plus optional images.
2. UI surface gallery: stable transcript and interaction samples covering uinify's
   complete rendering and customization surface.

The top bar keeps the GitHub icon and adds concise status copy so users can tell
which panel is live and which panel is deterministic.

Responsive behavior:

- Desktop: live chat is the primary left panel and gallery is the secondary right
  panel, using a two-column layout.
- Narrow screens: panels stack vertically with live chat first.

## Live Multimodal Chat Flow

The live panel replaces the current `<textarea>` form with the existing
`LexicalComposer`.

Composer behavior:

- Text entry through `LexicalComposer`.
- Image upload through the existing composer attachment button.
- Image paste and drag/drop through the existing composer attachment handlers.
- `/` command examples: `/analyze`, `/summarize`, `/extract`.
- `@` command examples: `@vision`, `@writer`, `@planner`.
- Submit payload preserves selected commands and attachments.

Attachment behavior:

- The example accepts image files only.
- Local validation rejects non-images, empty files, and images over a documented
  size limit.
- Image attachments are read as `data:` URLs in the browser.
- Successful image attachments move through a local queued-to-uploaded lifecycle.
- The live path does not create remote URLs or persistent storage.
- Gallery fixtures cover uploading, uploaded, error, and rejected states.

Local runtime behavior on submit:

- Dispatch a user message containing a text part when text exists.
- Dispatch image parts for submitted image attachments.
- Dispatch attachment parts so the transcript shows the submitted files.
- Show selected command metadata in the user message as local context text,
  without pretending commands are a backend protocol.

Server request behavior:

- The browser POSTs to `/api/chat`.
- The request body supports multimodal content:

```ts
type ExampleChatContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
```

- The server validates the shape and forwards OpenAI-compatible Chat Completions
  messages with `content: ExampleChatContentPart[]`.
- API key, base URL, and model stay server-side via environment variables.
- Assistant streaming text is still normalized into canonical `UiStreamEvent`
  frames and consumed with `readSSEStream`.

Error behavior:

- Invalid request body returns `400`.
- Missing env returns `500` with a clear local setup message.
- Upstream non-OK responses return `502`.
- Stream failures dispatch or surface a visible chat error.
- Attachment validation errors are visible in the composer tray.

## UI Surface Gallery

The gallery panel uses uinify's existing React components:

- `ChatRoot`
- `MessageList`
- `Message`
- `MessagePart`
- `ReasoningBlock`
- `StepBlock`
- `ImagePart`
- `AttachmentPart`
- `ArtifactContainer`
- action helpers through `ChatRoot` handlers

Gallery fixture coverage:

- Assistant markdown text.
- Reasoning part with toggle behavior.
- Tool/step parts across running, complete, and error states.
- Image part with caption and metadata.
- Attachment parts across uploaded, uploading, error, and rejected states.
- Artifact parts with code, JSON, and text views.
- Message feedback and part actions.

Customization coverage:

- `slotClassNames` is used in at least one panel to show stable styling hooks.
- `renderers` demonstrates at least one custom image or artifact renderer.
- The gallery includes a small event log or action readout so interaction payloads
  are visible when users toggle reasoning, switch artifact views, or click actions.

The gallery is deterministic and should render all showcase content immediately
without a model request.

## Docs

Update both English and Simplified Chinese example docs:

- Replace "text-only chat flow" with "live multimodal chat plus deterministic UI
  surface gallery".
- Document required env variables for live chat.
- Explain that images use browser-generated data URLs and local dev-server
  forwarding for the example.
- Re-state that the OpenAI-compatible adapter is reference-only and should not be
  treated as a supported public compatibility layer.

## Testing

Adapter tests:

- `buildOpenAICompatibleChatRequest` preserves text content.
- It emits OpenAI-compatible multimodal `content` arrays containing `image_url`
  data URLs.
- Request validation rejects invalid roles, empty content, malformed image parts,
  and unsupported content shapes.

Example app tests:

- Static examples app test confirms `/chat` is still the only route.
- Static test confirms live and gallery directories exist.
- Static test confirms `ChatExample.tsx` only composes live and gallery panels.
- Static test confirms no API key or env names leak into client source.

React/component tests:

- Live panel renders the existing `LexicalComposer`, not a bespoke textarea.
- Gallery renders reasoning, step, image, artifact, and attachment surfaces.
- Gallery action log records representative action payloads.

Verification commands:

```bash
pnpm typecheck
pnpm test
pnpm build:example
```

Manual browser verification:

- `/chat` opens without the route switcher.
- Live panel shows file upload, paste/drop-capable composer, `/` commands, and
  `@` commands.
- Submitting text plus an image reaches the local `/api/chat` endpoint and streams
  an assistant response.
- Gallery displays reasoning, steps, image, attachments, artifacts, actions, and
  customization examples immediately.

## Risks And Mitigations

- Some OpenAI-compatible providers differ in multimodal request details.
  Mitigation: keep the adapter explicitly reference-only and document the expected
  Chat Completions-style `image_url` shape.
- Data URLs can be large.
  Mitigation: enforce an example-specific image size limit before submit.
- `ChatExample.tsx` can become a large mixed file.
  Mitigation: keep it composition-only and enforce live/gallery directory
  separation in tests.
- Gallery fixtures can look fake if they are visually disconnected from live chat.
  Mitigation: use the same uinify components and the same theme tokens, while
  labeling the gallery as deterministic.
