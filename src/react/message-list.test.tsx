import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createChatRuntime } from "../runtime/create-chat-runtime"
import { ChatRoot } from "./chat-root"
import { MessageList } from "./message-list"

let consoleErrorSpy: ReturnType<typeof vi.spyOn> | null = null

afterEach(() => {
  consoleErrorSpy?.mockRestore()
  consoleErrorSpy = null
})

vi.mock("react-virtuoso", () => ({
  Virtuoso: ({
    data,
    itemContent,
    totalCount,
  }: {
    data: unknown[]
    itemContent: (index: number) => React.ReactNode
    totalCount: number
  }) => (
    <div data-testid="virtuoso-mock" data-count={totalCount}>
      {data.map((_, index) => (
        <div key={index}>{itemContent(index)}</div>
      ))}
    </div>
  ),
}))

describe("MessageList", () => {
  it("renders a linear transcript through Virtuoso when messages are passed", () => {
    const runtime = createChatRuntime({ conversationId: "demo" })

    render(
      <ChatRoot runtime={runtime}>
        <MessageList
          messages={[
            {
              id: "m1",
              role: "assistant",
              state: "complete",
              feedback: "none",
              parts: [{ id: "p1", kind: "text", text: "Hello" }],
            },
          ]}
        />
      </ChatRoot>,
    )

    expect(screen.getByTestId("virtuoso-mock")).toHaveAttribute("data-count", "1")
    expect(screen.getByText("Hello")).toBeInTheDocument()
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
})
