import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { CSSProperties } from "react"
import type { UiMessage } from "../../src/model/types"
import { createChatRuntime } from "../../src/runtime/create-chat-runtime"
import { ChatRoot } from "../../src/react/chat-root"
import { MessageList } from "../../src/react/message-list"

let consoleErrorSpy: ReturnType<typeof vi.spyOn> | null = null
let virtuosoProps: {
  alignToBottom?: boolean
  computeItemKey?: (index: number, message: UiMessage) => string
  data: UiMessage[]
  initialItemCount?: number
  initialTopMostItemIndex?: { align: "center" | "end" | "start"; index: "LAST" | number } | number
  itemContent: (index: number, message?: UiMessage) => React.ReactNode
  style?: CSSProperties
  totalCount: number
} | null = null

afterEach(() => {
  consoleErrorSpy?.mockRestore()
  consoleErrorSpy = null
  virtuosoProps = null
})

vi.mock("react-virtuoso", () => ({
  Virtuoso: ({
    alignToBottom,
    computeItemKey,
    data,
    initialItemCount,
    initialTopMostItemIndex,
    itemContent,
    style,
    totalCount,
  }: {
    alignToBottom?: boolean
    computeItemKey?: (index: number, message: UiMessage) => string
    data: UiMessage[]
    initialItemCount?: number
    initialTopMostItemIndex?: { align: "center" | "end" | "start"; index: "LAST" | number } | number
    itemContent: (index: number, message?: UiMessage) => React.ReactNode
    style?: CSSProperties
    totalCount: number
  }) => {
    virtuosoProps = {
      alignToBottom,
      computeItemKey,
      data,
      initialItemCount,
      initialTopMostItemIndex,
      itemContent,
      style,
      totalCount,
    }

    return (
      <div data-testid="virtuoso-mock" data-count={totalCount} style={style}>
        {data.map((message, index) => (
          <div key={computeItemKey?.(index, message) ?? index}>{itemContent(index, message)}</div>
        ))}
      </div>
    )
  },
}))

const demoMessages: UiMessage[] = [
  {
    id: "m1",
    role: "assistant",
    state: "complete",
    feedback: "none",
    parts: [{ id: "p1", kind: "text", text: "Hello" }],
  },
  {
    id: "m2",
    role: "assistant",
    state: "complete",
    feedback: "none",
    parts: [{ id: "p2", kind: "text", text: "World" }],
  },
]

describe("MessageList", () => {
  it("renders a linear transcript through Virtuoso when messages are passed", () => {
    const runtime = createChatRuntime({ conversationId: "demo" })

    render(
      <ChatRoot runtime={runtime}>
        <MessageList messages={[demoMessages[0]!]} />
      </ChatRoot>,
    )

    expect(screen.getByTestId("virtuoso-mock")).toHaveAttribute("data-count", "1")
    expect(screen.getByText("Hello")).toBeInTheDocument()
  })

  it("provides a default minimum viewport height for the virtualized list", () => {
    render(<MessageList messages={[demoMessages[0]!]} />)

    expect(virtuosoProps?.style).toMatchObject({ minHeight: "20rem" })
  })

  it("does not bottom-align a single-message transcript", () => {
    render(<MessageList messages={[demoMessages[0]!]} />)

    expect(virtuosoProps?.alignToBottom).toBeUndefined()
    expect(virtuosoProps?.initialTopMostItemIndex).toBeUndefined()
  })

  it("renders a single-message transcript on the initial pass", () => {
    render(<MessageList messages={[demoMessages[0]!]} />)

    expect(virtuosoProps?.initialItemCount).toBe(1)
  })

  it("starts multi-message transcripts at the latest message", () => {
    render(<MessageList messages={demoMessages} />)

    expect(virtuosoProps?.alignToBottom).toBeUndefined()
    expect(virtuosoProps?.initialTopMostItemIndex).toEqual({ align: "end", index: "LAST" })
  })

  it("uses message ids for Virtuoso row identity", () => {
    const runtime = createChatRuntime({ conversationId: "demo" })

    render(
      <ChatRoot runtime={runtime}>
        <MessageList messages={demoMessages} />
      </ChatRoot>,
    )

    expect(virtuosoProps?.computeItemKey?.(0, demoMessages[0]!)).toBe("m1")
    expect(virtuosoProps?.computeItemKey?.(1, demoMessages[1]!)).toBe("m2")
  })

  it("renders mixed transcript parts through MessageList", () => {
    render(
      <MessageList
        messages={[
          {
            id: "m1",
            role: "assistant",
            state: "complete",
            feedback: "none",
            parts: [
              { id: "text-1", kind: "text", text: "Final answer" },
              { id: "reasoning-1", kind: "reasoning", text: "Thinking through the request", state: "complete" },
              {
                id: "step-1",
                kind: "step",
                category: "tool",
                status: "complete",
                label: "Search docs",
                inputSummary: "query: agent steps",
                outputSummary: "Found the guide",
              },
              {
                id: "image-1",
                kind: "image",
                url: "https://example.com/diagram.png",
                alt: "Architecture diagram",
                mimeType: "image/png",
                width: 640,
                height: 480,
                sourceAttachmentId: "attachment-source-1",
              },
              {
                id: "artifact-1",
                kind: "artifact",
                artifact: {
                  id: "artifact-body-1",
                  kind: "code",
                  title: "Generated snippet",
                  metadata: { language: "ts" },
                  defaultViewId: "source",
                  views: [
                    {
                      id: "source",
                      label: "Source",
                      kind: "source",
                      language: "ts",
                      value: "export const answer = 42",
                    },
                  ],
                },
              },
              {
                id: "attachment-1",
                kind: "attachment",
                attachment: {
                  id: "attachment-source-1",
                  name: "notes.pdf",
                  mimeType: "application/pdf",
                  status: "uploaded",
                  remoteUrl: "https://example.com/notes.pdf",
                },
              },
            ],
          },
        ]}
      />,
    )

    expect(screen.getByText("Final answer")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Show reasoning" })).toBeInTheDocument()
    expect(screen.getByText("Search docs")).toBeInTheDocument()
    expect(screen.getByText("Found the guide")).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Architecture diagram" })).toBeInTheDocument()
    expect(screen.getByText("Generated snippet")).toBeInTheDocument()
    expect(screen.getByText("export const answer = 42")).toBeInTheDocument()
    expect(screen.getByText("notes.pdf")).toBeInTheDocument()
  })

  it("resets message error boundaries when the step renderer identity changes", () => {
    const messages = [
      {
        id: "m1",
        role: "assistant" as const,
        state: "complete" as const,
        feedback: "none" as const,
        parts: [{ id: "s1", kind: "step" as const, category: "planner" as const, status: "complete" as const, label: "Plan" }],
      },
    ]
    const firstRenderStep = () => {
      throw new Error("bad step renderer")
    }
    const secondRenderStep = () => <div>Recovered step</div>
    const runtime = createChatRuntime()
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const { rerender } = render(
      <ChatRoot runtime={runtime} renderers={{ renderStep: firstRenderStep }}>
        <MessageList messages={messages} />
      </ChatRoot>,
    )

    expect(screen.getByText("Message failed to render")).toBeInTheDocument()

    rerender(
      <ChatRoot runtime={runtime} renderers={{ renderStep: secondRenderStep }}>
        <MessageList messages={messages} />
      </ChatRoot>,
    )

    expect(screen.getByText("Recovered step")).toBeInTheDocument()
  })

  it("resets message error boundaries when the image renderer identity changes", () => {
    const messages = [
      {
        id: "m1",
        role: "assistant" as const,
        state: "complete" as const,
        feedback: "none" as const,
        parts: [{ id: "img1", kind: "image" as const, url: "https://example.com/image.png", alt: "Example" }],
      },
    ]
    const firstRenderImage = () => {
      throw new Error("bad image renderer")
    }
    const secondRenderImage = () => <div>Recovered image</div>
    const runtime = createChatRuntime()
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const { rerender } = render(
      <ChatRoot runtime={runtime} renderers={{ renderImage: firstRenderImage }}>
        <MessageList messages={messages} />
      </ChatRoot>,
    )

    expect(screen.getByText("Message failed to render")).toBeInTheDocument()

    rerender(
      <ChatRoot runtime={runtime} renderers={{ renderImage: secondRenderImage }}>
        <MessageList messages={messages} />
      </ChatRoot>,
    )

    expect(screen.getByText("Recovered image")).toBeInTheDocument()
  })

  it("does not require ChatRoot when messages are passed", () => {
    const { rerender } = render(<MessageList messages={[demoMessages[0]!]} />)

    expect(screen.getByText("Hello")).toBeInTheDocument()

    rerender(<MessageList messages={[demoMessages[1]!]} />)

    expect(screen.getByText("World")).toBeInTheDocument()
  })

  it("falls back when a message render crashes", () => {
    const runtime = createChatRuntime({ conversationId: "demo" })
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    render(
      <ChatRoot
        runtime={runtime}
        renderers={{
          renderReasoning: () => {
            throw new Error("boom")
          },
        }}
      >
        <MessageList
          messages={[
            {
              id: "m1",
              role: "assistant",
              state: "complete",
              feedback: "none",
              parts: [
                { id: "p1", kind: "reasoning", text: "unsafe", state: "complete" },
              ],
            },
          ]}
        />
      </ChatRoot>,
    )

    expect(screen.getByText("Message failed to render")).toBeInTheDocument()
  })

  it("recovers from a prior row render failure when renderer input changes", () => {
    const runtime = createChatRuntime({ conversationId: "demo" })
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const messages: UiMessage[] = [
      {
        id: "m1",
        role: "assistant",
        state: "complete",
        feedback: "none",
        parts: [{ id: "p1", kind: "reasoning", text: "safe", state: "complete" }],
      },
    ]

    const { rerender } = render(
      <ChatRoot
        runtime={runtime}
        renderers={{
          renderReasoning: ({ part }) => {
            throw new Error(part.text)
          },
        }}
      >
        <MessageList messages={messages} />
      </ChatRoot>,
    )

    expect(screen.getByText("Message failed to render")).toBeInTheDocument()

    rerender(
      <ChatRoot
        runtime={runtime}
        renderers={{
          renderReasoning: ({ part }) => <div>{part.text}</div>,
        }}
      >
        <MessageList messages={messages} />
      </ChatRoot>,
    )

    expect(screen.queryByText("Message failed to render")).not.toBeInTheDocument()
    expect(screen.getByText("safe")).toBeInTheDocument()
  })
})
