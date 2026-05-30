import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { StrictMode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { UiArtifactPart, UiMessagePart } from "../../src/model/types"
import { createChatRuntime } from "../../src/runtime/create-chat-runtime"
import { AttachmentPart } from "../../src/react/attachment-part"
import { ChatRoot } from "../../src/react/chat-root"
import * as chatRootModule from "../../src/react/chat-root"
import { CurrentMessageProvider } from "../../src/react/current-message"
import * as currentMessageModule from "../../src/react/current-message"
import { MessagePart } from "../../src/react/message-part"
import { ReasoningBlock } from "../../src/react/reasoning-block"
import { RenderersProvider } from "../../src/react/renderers"

afterEach(() => {
  vi.restoreAllMocks()
})

describe("AttachmentPart", () => {
  it("renders uploaded attachments as links when remoteUrl exists", () => {
    render(
      <AttachmentPart
        part={{
          id: "attachment-link-1",
          kind: "attachment",
          attachment: {
            id: "file-1",
            name: "report.pdf",
            status: "uploaded",
            remoteUrl: "https://example.com/report.pdf",
          },
        }}
      />,
    )

    expect(screen.getByRole("link", { name: "report.pdf" })).toHaveAttribute(
      "href",
      "https://example.com/report.pdf",
    )
    expect(screen.getByRole("link", { name: "report.pdf" }).closest('[data-slot="attachment-part"]')).toBeTruthy()
  })

  it("renders attachment names as plain text when remoteUrl is absent", () => {
    render(
      <AttachmentPart
        part={{
          id: "attachment-text-1",
          kind: "attachment",
          attachment: {
            id: "file-2",
            name: "draft.pdf",
            status: "uploading",
          },
        }}
      />,
    )

    expect(screen.getByText("draft.pdf")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "draft.pdf" })).not.toBeInTheDocument()
  })

  it("renders attachment error text", () => {
    render(
      <AttachmentPart
        part={{
          id: "attachment-error-1",
          kind: "attachment",
          attachment: {
            id: "file-3",
            name: "failed.pdf",
            status: "error",
            error: "Upload failed",
          },
        }}
      />,
    )

    expect(screen.getByText("Upload failed")).toBeInTheDocument()
  })

  it("exposes lifecycle state on the stable attachment slot", () => {
    render(
      <AttachmentPart
        part={{
          id: "attachment-state-1",
          kind: "attachment",
          attachment: {
            id: "file-4",
            name: "queued.pdf",
            status: "queued",
          },
        }}
      />,
    )

    expect(screen.getByText("queued.pdf").closest('[data-slot="attachment-part"]')).toHaveAttribute(
      "data-state",
      "queued",
    )
  })
})

describe("MessagePart", () => {
  it("renders markdown text with gfm support", () => {
    render(
      <MessagePart
        part={{
          id: "text-1",
          kind: "text",
          text: "- [x] shipped\n\n| col |\n| --- |\n| ok |",
        }}
      />,
    )

    expect(screen.getByRole("checkbox")).toBeChecked()
    expect(screen.getByRole("table")).toBeInTheDocument()
    expect(screen.getByText("ok")).toBeInTheDocument()
  })

  it("renders image parts", () => {
    render(
      <MessagePart
        part={{
          id: "image-1",
          kind: "image",
          url: "https://example.com/demo.png",
          alt: "Preview",
        }}
      />,
    )

    expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
      "src",
      "https://example.com/demo.png",
    )
  })

  it("renders tool steps through the default step block", () => {
    render(
      <MessagePart
        part={{
          id: "s1",
          kind: "step",
          category: "tool",
          status: "running",
          label: "Search docs",
          inputSummary: "query: SSE support",
        }}
      />,
    )

    expect(screen.getByText("Search docs")).toBeInTheDocument()
    expect(screen.getByText("query: SSE support")).toBeInTheDocument()
    expect(screen.getByText("tool")).toBeInTheDocument()
    expect(screen.getByText("running")).toBeInTheDocument()
  })

  it("uses renderStep overrides", () => {
    const runtime = createChatRuntime()

    render(
      <ChatRoot runtime={runtime} renderers={{ renderStep: ({ part }) => <div>custom {part.label}</div> }}>
        <MessagePart part={{ id: "s1", kind: "step", category: "planner", status: "complete", label: "Plan" }} />
      </ChatRoot>,
    )

    expect(screen.getByText("custom Plan")).toBeInTheDocument()
  })

  it("uses renderImage overrides", () => {
    const runtime = createChatRuntime()

    render(
      <ChatRoot runtime={runtime} renderers={{ renderImage: ({ part }) => <div>custom image {part.alt}</div> }}>
        <MessagePart
          part={{
            id: "img1",
            kind: "image",
            url: "https://example.com/diagram.png",
            alt: "Diagram",
            mimeType: "image/png",
            width: 640,
            height: 480,
            sourceAttachmentId: "attachment-1",
          }}
        />
      </ChatRoot>,
    )

    expect(screen.getByText("custom image Diagram")).toBeInTheDocument()
  })

  it("renders default image metadata and local fallback when an image fails to load", () => {
    render(
      <MessagePart
        part={{
          id: "img1",
          kind: "image",
          url: "https://example.com/missing.png",
          alt: "Missing diagram",
          mimeType: "image/png",
          width: 640,
          height: 480,
          sourceAttachmentId: "attachment-1",
        }}
      />,
    )

    const image = screen.getByRole("img", { name: "Missing diagram" })
    expect(image).toHaveAttribute("src", "https://example.com/missing.png")
    expect(image).toHaveAttribute("width", "640")
    expect(image).toHaveAttribute("height", "480")
    expect(image.closest('[data-slot="image"]')).toHaveAttribute("data-mime-type", "image/png")
    expect(image.closest('[data-slot="image"]')).toHaveAttribute("data-source-attachment-id", "attachment-1")

    fireEvent.error(image)

    expect(screen.getByText(/Image failed to load/)).toBeInTheDocument()
  })

  it("renders failed image fallback and alt context as a single figure caption", () => {
    const { container } = render(
      <MessagePart
        part={{
          id: "img1",
          kind: "image",
          url: "https://example.com/missing.png",
          alt: "Missing diagram",
        }}
      />,
    )

    fireEvent.error(screen.getByRole("img", { name: "Missing diagram" }))

    expect(container.querySelectorAll("figcaption")).toHaveLength(1)
    expect(screen.getByText("Image failed to load: Missing diagram")).toBeInTheDocument()
  })

  it("does not render legacy tool-call parts", () => {
    render(<MessagePart part={{ id: "legacy-tool", kind: "tool-call" } as never} />)

    expect(screen.queryByText("legacy-tool")).not.toBeInTheDocument()
  })

  it("renders attachment parts through a stable attachment slot", () => {
    render(
      <MessagePart
        part={{
          id: "attachment-1",
          kind: "attachment",
          attachment: {
            id: "file-1",
            name: "report.pdf",
            status: "uploaded",
            remoteUrl: "https://example.com/report.pdf",
          },
        }}
      />,
    )

    expect(screen.getByRole("link", { name: "report.pdf" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "report.pdf" }).closest('[data-slot="attachment-part"]')).toBeTruthy()
    expect(screen.getByRole("link", { name: "report.pdf" }).closest('[data-slot="message-part"]')).toHaveAttribute(
      "data-type",
      "attachment",
    )
    expect(screen.getByRole("link", { name: "report.pdf" }).closest('[data-slot="attachment-part"]')).toHaveAttribute(
      "data-state",
      "uploaded",
    )
  })

  it("toggles reasoning details", async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    const useCurrentMessageSpy = vi.spyOn(currentMessageModule, "useCurrentMessage")
    const useChatActionHandlersSpy = vi.spyOn(chatRootModule, "useChatActionHandlers")

    render(
      <StrictMode>
        <ReasoningBlock
          onToggle={onToggle}
          part={{
            id: "reasoning-1",
            kind: "reasoning",
            text: "Draft answer plan",
            state: "complete",
          }}
        />
      </StrictMode>,
    )

    const toggle = screen.getByRole("button", { name: /show reasoning/i })
    expect(screen.queryByText("Draft answer plan")).not.toBeInTheDocument()

    await user.click(toggle)
    expect(screen.getByText("Draft answer plan")).toBeInTheDocument()
    expect(onToggle).toHaveBeenNthCalledWith(1, true)
    expect(onToggle).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole("button", { name: /hide reasoning/i }))
    expect(screen.queryByText("Draft answer plan")).not.toBeInTheDocument()
    expect(onToggle).toHaveBeenNthCalledWith(2, false)
    expect(onToggle).toHaveBeenCalledTimes(2)

    expect(useCurrentMessageSpy).not.toHaveBeenCalled()
    expect(useChatActionHandlersSpy).not.toHaveBeenCalled()
  })

  it("reports reasoning surface toggles through the surrounding action layer", async () => {
    const user = userEvent.setup()
    const onPartAction = vi.fn()
    const runtime = createChatRuntime({ conversationId: "demo" })
    const message = {
      id: "m1",
      role: "assistant" as const,
      state: "complete" as const,
      feedback: "none" as const,
      parts: [],
    }

    render(
      <ChatRoot runtime={runtime} onPartAction={onPartAction}>
        <CurrentMessageProvider message={message}>
          <MessagePart
            part={{
              id: "reasoning-1",
              kind: "reasoning",
              text: "Draft answer plan",
              state: "complete",
            }}
          />
        </CurrentMessageProvider>
      </ChatRoot>,
    )

    await user.click(screen.getByRole("button", { name: "Show reasoning" }))
    await user.click(screen.getByRole("button", { name: "Hide reasoning" }))

    expect(onPartAction).toHaveBeenNthCalledWith(1, {
      action: "toggle-reasoning",
      messageId: "m1",
      partId: "reasoning-1",
      partKind: "reasoning",
    })
    expect(onPartAction).toHaveBeenNthCalledWith(2, {
      action: "toggle-reasoning",
      messageId: "m1",
      partId: "reasoning-1",
      partKind: "reasoning",
    })
    expect(onPartAction).toHaveBeenCalledTimes(2)
  })

  it("routes artifact parts through the shared artifact container", async () => {
    const user = userEvent.setup()

    render(
      <MessagePart
        part={{
          id: "artifact-1",
          kind: "artifact",
          artifact: {
            id: "artifact-code-1",
            kind: "code",
            title: "Code preview",
            metadata: {
              path: "src/demo.ts",
            },
            defaultViewId: "preview",
            views: [
              {
                id: "source",
                label: "TypeScript",
                kind: "source",
                language: "ts",
                value: "const value = 1",
              },
              {
                id: "preview",
                label: "Preview",
                kind: "preview",
                value: "Rendered preview",
              },
            ],
          },
        }}
      />,
    )

    expect(screen.getByText("Code preview")).toBeInTheDocument()
    expect(screen.getByText("path")).toBeInTheDocument()
    expect(screen.getByText("src/demo.ts")).toBeInTheDocument()
    expect(screen.getByText("Rendered preview")).toBeInTheDocument()
    expect(screen.queryByText("const value = 1")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "TypeScript" }))

    expect(screen.getByText("const value = 1")).toBeInTheDocument()
  })

  it("renders plain text artifact previews", () => {
    render(
      <MessagePart
        part={{
          id: "artifact-plain-1",
          kind: "artifact",
          artifact: {
            id: "artifact-text-plain-1",
            kind: "text",
            views: [
              {
                id: "plain-text",
                label: "Text",
                kind: "preview",
                value: "Plain text artifact preview",
              },
            ],
          },
        }}
      />,
    )

    expect(screen.getByRole("button", { name: "Text" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText("Plain text artifact preview")).toBeInTheDocument()
  })

  it("renders json artifacts through the shared container path", () => {
    render(
      <MessagePart
        part={{
          id: "artifact-json-1",
          kind: "artifact",
          artifact: {
            id: "artifact-json-view-1",
            kind: "json",
            title: "JSON preview",
            defaultViewId: "json",
            views: [
              {
                id: "json",
                label: "JSON",
                kind: "preview",
                value: '{"title":"Demo","count":2}',
              },
            ],
          },
        }}
      />,
    )

    const container = screen.getByText("JSON preview").closest('[data-slot="artifact-container"]')

    expect(screen.getByText("JSON preview")).toBeInTheDocument()
    expect(container?.querySelector('[data-slot="artifact-body"] pre')?.textContent).toBe(
      '{\n  "title": "Demo",\n  "count": 2\n}',
    )
    expect(screen.getByText("JSON preview").closest('[data-slot="artifact-text"]')).toBeTruthy()
  })

  it("renders unknown artifact kinds with the default body through the shared container path", () => {
    render(
      <MessagePart
        part={{
          id: "artifact-unknown-kind",
          kind: "artifact",
          artifact: {
            id: "artifact-diagram-1",
            kind: "diagram",
            title: "System diagram",
            defaultViewId: "preview",
            views: [
              {
                id: "preview",
                label: "Preview",
                kind: "preview",
                value: "Diagram fallback preview",
              },
            ],
          },
        }}
      />,
    )

    expect(screen.getByText("System diagram")).toBeInTheDocument()
    expect(screen.getByText("Diagram fallback preview")).toBeInTheDocument()
    expect(screen.getByText("System diagram").closest('[data-slot="artifact-container"]')).toBeTruthy()
  })

  it("uses renderArtifactFallback through the MessagePart artifact container path", () => {
    const renderArtifactFallback = vi.fn(({ artifact, view }) => (
      <div>
        Fallback artifact renderer for {artifact.kind}: {String(view.value)}
      </div>
    ))

    render(
      <RenderersProvider value={{ renderArtifactFallback }}>
        <MessagePart
          part={{
            id: "artifact-fallback-path",
            kind: "artifact",
            artifact: {
              id: "artifact-diagram-2",
              kind: "diagram",
              title: "Rendered with fallback",
              defaultViewId: "preview",
              views: [
                {
                  id: "preview",
                  label: "Preview",
                  kind: "preview",
                  value: "Fallback body content",
                },
              ],
            },
          }}
        />
      </RenderersProvider>,
    )

    expect(screen.getByText("Rendered with fallback")).toBeInTheDocument()
    expect(screen.getByText("Fallback artifact renderer for diagram: Fallback body content")).toBeInTheDocument()
    expect(renderArtifactFallback).toHaveBeenCalledTimes(1)
    expect(renderArtifactFallback).toHaveBeenCalledWith({
      artifact: {
        id: "artifact-diagram-2",
        kind: "diagram",
        title: "Rendered with fallback",
        defaultViewId: "preview",
        views: [
          {
            id: "preview",
            label: "Preview",
            kind: "preview",
            value: "Fallback body content",
          },
        ],
      },
      part: {
        id: "artifact-fallback-path",
        kind: "artifact",
        artifact: {
          id: "artifact-diagram-2",
          kind: "diagram",
          title: "Rendered with fallback",
          defaultViewId: "preview",
          views: [
            {
              id: "preview",
              label: "Preview",
              kind: "preview",
              value: "Fallback body content",
            },
          ],
        },
      },
      view: {
        id: "preview",
        label: "Preview",
        kind: "preview",
        value: "Fallback body content",
      },
    })
  })

  it("treats prototype-colliding artifact kinds as unknown and still uses renderArtifactFallback", () => {
    const renderArtifactFallback = vi.fn(({ artifact }) => <div>Fallback artifact renderer for {artifact.kind}</div>)

    render(
      <RenderersProvider value={{ artifactRegistry: {}, renderArtifactFallback }}>
        <MessagePart
          part={{
            id: "artifact-prototype-kind-fallback",
            kind: "artifact",
            artifact: {
              id: "artifact-constructor-1",
              kind: "constructor",
              title: "Prototype kind fallback",
              defaultViewId: "preview",
              views: [
                {
                  id: "preview",
                  label: "Preview",
                  kind: "preview",
                  value: "Prototype-safe fallback",
                },
              ],
            },
          }}
        />
      </RenderersProvider>,
    )

    expect(screen.getByText("Prototype kind fallback")).toBeInTheDocument()
    expect(screen.getByText("Fallback artifact renderer for constructor")).toBeInTheDocument()
    expect(renderArtifactFallback).toHaveBeenCalledTimes(1)
  })

  it("treats prototype-colliding artifact kinds as unknown and uses the built-in default body", () => {
    render(
      <RenderersProvider value={{ artifactRegistry: {} }}>
        <MessagePart
          part={{
            id: "artifact-prototype-kind-default",
            kind: "artifact",
            artifact: {
              id: "artifact-to-string-1",
              kind: "toString",
              title: "Prototype kind default",
              defaultViewId: "preview",
              views: [
                {
                  id: "preview",
                  label: "Preview",
                  kind: "preview",
                  value: "Prototype-safe default body",
                },
              ],
            },
          }}
        />
      </RenderersProvider>,
    )

    expect(screen.getByText("Prototype kind default")).toBeInTheDocument()
    expect(screen.getByText("Prototype-safe default body")).toBeInTheDocument()
  })

  it("selects the default artifact view when defaultViewId is set", () => {
    render(
      <MessagePart
        part={{
          id: "artifact-default-view",
          kind: "artifact",
          artifact: {
            id: "artifact-default-view-1",
            kind: "code",
            defaultViewId: "preview",
            views: [
              {
                id: "source",
                label: "Source",
                kind: "source",
                language: "ts",
                value: "const hidden = true",
              },
              {
                id: "preview",
                label: "Preview",
                kind: "preview",
                value: "Rendered preview",
              },
            ],
          },
        }}
      />,
    )

    expect(screen.getByRole("button", { name: "Preview" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText("Rendered preview")).toBeInTheDocument()
    expect(screen.queryByText("const hidden = true")).not.toBeInTheDocument()
  })

  it("renders structured artifact views without crashing", () => {
    const structuredValue: Record<string, unknown> = { title: "Demo" }
    structuredValue.self = structuredValue

    expect(() =>
      render(
        <MessagePart
          part={{
            id: "artifact-structured-view",
            kind: "artifact",
            artifact: {
              id: "artifact-structured-view-1",
              kind: "text",
              views: [
                {
                  id: "structured",
                  label: "Structured",
                  kind: "structured",
                  value: structuredValue,
                },
              ],
            },
          }}
        />,
      ),
    ).not.toThrow()

    expect(screen.getByRole("button", { name: "Structured" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText("[structured artifact view unavailable]")).toBeInTheDocument()
  })

  it("uses renderer overrides for reasoning and artifact registries", () => {
    const renderReasoning = vi.fn(() => <div>Custom reasoning</div>)
    const renderCodeArtifact = vi.fn(() => <div>Custom artifact</div>)

    const artifactPart: UiArtifactPart = {
      id: "artifact-2",
      kind: "artifact",
      artifact: {
        id: "artifact-code-2",
        kind: "code",
        views: [
          {
            id: "source",
            label: "TypeScript",
            kind: "source",
            language: "ts",
            value: "const value = 2",
          },
        ],
      },
    }

    const parts: UiMessagePart[] = [
      {
        id: "reasoning-2",
        kind: "reasoning",
        text: "Internal chain",
        state: "streaming",
      },
      artifactPart,
      {
        id: "artifact-3",
        kind: "artifact",
        artifact: {
          id: "artifact-text-1",
          kind: "text",
          views: [
            {
              id: "text",
              label: "Text",
              kind: "preview",
              value: "Plain text artifact",
            },
          ],
        },
      },
    ]

    render(
      <RenderersProvider
        value={{
          renderReasoning,
          artifactRegistry: {
            code: renderCodeArtifact,
          },
        }}
      >
        {parts.map((part) => (
          <MessagePart key={part.id} part={part} />
        ))}
      </RenderersProvider>,
    )

    expect(screen.getByText("Custom reasoning")).toBeInTheDocument()
    expect(screen.getByText("Custom artifact")).toBeInTheDocument()
    expect(screen.getByText("Plain text artifact")).toBeInTheDocument()
    expect(renderReasoning).toHaveBeenCalledTimes(1)
    expect(renderCodeArtifact).toHaveBeenCalledTimes(1)
    expect(renderCodeArtifact).toHaveBeenCalledWith({
      artifact: artifactPart.artifact,
      part: artifactPart,
      view: artifactPart.artifact.views[0],
    })
  })

  it("preserves stable part slots when renderer overrides are used", () => {
    render(
      <RenderersProvider
        value={{
          renderReasoning: () => <div>Custom reasoning</div>,
          artifactRegistry: {
            code: () => <div>Custom artifact</div>,
          },
        }}
      >
        <>
          <MessagePart
            part={{
              id: "reasoning-override",
              kind: "reasoning",
              text: "Internal chain",
              state: "streaming",
            }}
          />
          <MessagePart
            part={{
              id: "artifact-override",
              kind: "artifact",
              artifact: {
                id: "artifact-code-override",
                kind: "code",
                views: [
                  {
                    id: "source",
                    label: "TypeScript",
                    kind: "source",
                    language: "ts",
                    value: "const custom = true",
                  },
                ],
              },
            }}
          />
        </>
      </RenderersProvider>,
    )

    expect(screen.getByText("Custom reasoning").closest('[data-slot="reasoning"]')).toBeTruthy()
    expect(screen.getByText("Custom artifact").closest('[data-slot="artifact-code"]')).toBeTruthy()
  })
})
