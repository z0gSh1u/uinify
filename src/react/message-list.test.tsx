import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { UiMessage } from "../model/types"
import { createChatRuntime } from "../runtime/create-chat-runtime"
import { ChatRoot } from "./chat-root"
import { MessageList } from "./message-list"

let consoleErrorSpy: ReturnType<typeof vi.spyOn> | null = null
let virtuosoProps: {
  computeItemKey?: (index: number, message: UiMessage) => string
  data: UiMessage[]
  itemContent: (index: number, message?: UiMessage) => React.ReactNode
  totalCount: number
} | null = null

afterEach(() => {
  consoleErrorSpy?.mockRestore()
  consoleErrorSpy = null
  virtuosoProps = null
})

vi.mock("react-virtuoso", () => ({
  Virtuoso: ({
    computeItemKey,
    data,
    itemContent,
    totalCount,
  }: {
    computeItemKey?: (index: number, message: UiMessage) => string
    data: UiMessage[]
    itemContent: (index: number, message?: UiMessage) => React.ReactNode
    totalCount: number
  }) => {
    virtuosoProps = { computeItemKey, data, itemContent, totalCount }

    return (
      <div data-testid="virtuoso-mock" data-count={totalCount}>
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
