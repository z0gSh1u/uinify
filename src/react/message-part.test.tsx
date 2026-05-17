import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { UiMessagePart } from "../model/types"
import { MessagePart } from "./message-part"
import { RenderersProvider } from "./renderers"

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

  it("toggles reasoning details", async () => {
    const user = userEvent.setup()

    render(
      <MessagePart
        part={{
          id: "reasoning-1",
          kind: "reasoning",
          text: "Draft answer plan",
          state: "complete",
        }}
      />,
    )

    const toggle = screen.getByRole("button", { name: /show reasoning/i })
    expect(screen.queryByText("Draft answer plan")).not.toBeInTheDocument()

    await user.click(toggle)
    expect(screen.getByText("Draft answer plan")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /hide reasoning/i }))
    expect(screen.queryByText("Draft answer plan")).not.toBeInTheDocument()
  })

  it("shows tool call name and summaries", () => {
    render(
      <MessagePart
        part={{
          id: "tool-1",
          kind: "tool-call",
          toolName: "searchCode",
          status: "complete",
          inputSummary: "Search src/react",
          outputSummary: "Found 4 matches",
        }}
      />,
    )

    expect(screen.getByText("searchCode")).toBeInTheDocument()
    expect(screen.getByText("Search src/react")).toBeInTheDocument()
    expect(screen.getByText("Found 4 matches")).toBeInTheDocument()
  })

  it("renders artifact code previews", () => {
    render(
      <MessagePart
        part={{
          id: "artifact-1",
          kind: "artifact",
          artifact: {
            id: "artifact-code-1",
            kind: "code",
            language: "ts",
            content: "const value = 1",
          },
        }}
      />,
    )

    expect(screen.getByText("ts")).toBeInTheDocument()
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
            content: "Plain text artifact preview",
          },
        }}
      />,
    )

    expect(screen.getByText("text")).toBeInTheDocument()
    expect(screen.getByText("Plain text artifact preview")).toBeInTheDocument()
  })

  it("uses renderer overrides for reasoning, tool calls, and artifacts", () => {
    const renderReasoning = vi.fn(() => <div>Custom reasoning</div>)
    const renderToolCall = vi.fn(() => <div>Custom tool call</div>)
    const renderArtifactCode = vi.fn(() => <div>Custom artifact</div>)

    const parts: UiMessagePart[] = [
      {
        id: "reasoning-2",
        kind: "reasoning",
        text: "Internal chain",
        state: "streaming",
      },
      {
        id: "tool-2",
        kind: "tool-call",
        toolName: "lookupDocs",
        status: "running",
        inputSummary: null,
        outputSummary: null,
      },
      {
        id: "artifact-2",
        kind: "artifact",
        artifact: {
          id: "artifact-text-1",
          kind: "text",
          content: "Plain text artifact",
        },
      },
    ]

    render(
      <RenderersProvider
        value={{
          renderReasoning,
          renderToolCall,
          renderArtifactCode,
        }}
      >
        {parts.map((part) => (
          <MessagePart key={part.id} part={part} />
        ))}
      </RenderersProvider>,
    )

    expect(screen.getByText("Custom reasoning")).toBeInTheDocument()
    expect(screen.getByText("Custom tool call")).toBeInTheDocument()
    expect(screen.getByText("Custom artifact")).toBeInTheDocument()
    expect(renderReasoning).toHaveBeenCalledTimes(1)
    expect(renderToolCall).toHaveBeenCalledTimes(1)
    expect(renderArtifactCode).toHaveBeenCalledTimes(1)
    expect(renderArtifactCode).toHaveBeenCalledWith({ part: parts[2] })
  })

  it("preserves stable part slots when renderer overrides are used", () => {
    render(
      <RenderersProvider
        value={{
          renderReasoning: () => <div>Custom reasoning</div>,
          renderToolCall: () => <div>Custom tool call</div>,
          renderArtifactCode: () => <div>Custom artifact</div>,
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
              id: "tool-override",
              kind: "tool-call",
              toolName: "lookupDocs",
              status: "running",
              inputSummary: null,
              outputSummary: null,
            }}
          />
          <MessagePart
            part={{
              id: "artifact-override",
              kind: "artifact",
              artifact: {
                id: "artifact-code-override",
                kind: "code",
                language: "ts",
                content: "const custom = true",
              },
            }}
          />
        </>
      </RenderersProvider>,
    )

    expect(screen.getByText("Custom reasoning").closest('[data-slot="reasoning"]')).toBeTruthy()
    expect(screen.getByText("Custom tool call").closest('[data-slot="toolcall"]')).toBeTruthy()
    expect(screen.getByText("Custom artifact").closest('[data-slot="artifact-code"]')).toBeTruthy()
  })
})
