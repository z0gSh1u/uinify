import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createChatRuntime } from "../runtime/create-chat-runtime"
import { ChatRoot, useChatRuntime } from "./chat-root"
import { MessageList } from "./message-list"

vi.mock("react-virtuoso", () => ({
  Virtuoso: ({
    data,
    itemContent,
  }: {
    data: unknown[]
    itemContent: (index: number) => React.ReactNode
  }) => <div>{data.map((_, index) => <div key={index}>{itemContent(index)}</div>)}</div>,
}))

let consoleErrorSpy: ReturnType<typeof vi.spyOn> | null = null

afterEach(() => {
  consoleErrorSpy?.mockRestore()
  consoleErrorSpy = null
})

describe("ChatRoot", () => {
  it("allows renderer overrides for runtime-backed messages", () => {
    const runtime = createChatRuntime({ conversationId: "demo" })
    runtime.dispatch({ type: "message.started", messageId: "m1", role: "assistant" })
    runtime.dispatch({ type: "part.reasoning.delta", messageId: "m1", partId: "p1", delta: "safe" })

    render(
      <ChatRoot
        runtime={runtime}
        renderers={{
          renderReasoning: ({ part }) => <div data-testid="custom-reasoning">{part.text}</div>,
        }}
      >
        <MessageList />
      </ChatRoot>,
    )

    expect(screen.getByTestId("custom-reasoning")).toHaveTextContent("safe")
  })

  it("applies slotClassNames to message and message-parts", () => {
    const runtime = createChatRuntime({ conversationId: "demo" })
    runtime.dispatch({ type: "message.started", messageId: "m1", role: "assistant" })
    runtime.dispatch({ type: "part.text.delta", messageId: "m1", partId: "p1", delta: "Hello" })
    runtime.dispatch({ type: "message.completed", messageId: "m1" })

    render(
      <ChatRoot
        runtime={runtime}
        slotClassNames={{
          message: "custom-message",
          messageParts: "custom-message-parts",
        }}
      >
        <MessageList />
      </ChatRoot>,
    )

    expect(screen.getByText("Hello").closest('[data-slot="message"]')).toHaveClass("custom-message")
    expect(screen.getByText("Hello").closest('[data-slot="message-parts"]')).toHaveClass(
      "custom-message-parts",
    )
  })

  it("exposes stable slots for reasoning toolcall and artifact-code blocks", () => {
    const runtime = createChatRuntime({ conversationId: "demo" })
    runtime.dispatch({ type: "message.started", messageId: "m1", role: "assistant" })
    runtime.dispatch({ type: "part.reasoning.delta", messageId: "m1", partId: "p1", delta: "Think" })
    runtime.dispatch({
      type: "part.tool.updated",
      messageId: "m1",
      partId: "p2",
      toolName: "search",
      status: "complete",
      inputSummary: "query",
      outputSummary: "done",
    })
    runtime.dispatch({
      type: "part.artifact.emitted",
      messageId: "m1",
      partId: "p3",
      artifact: {
        id: "a1",
        kind: "code",
        language: "ts",
        content: "const answer = 42",
      },
    })
    runtime.dispatch({ type: "message.completed", messageId: "m1" })

    render(
      <ChatRoot runtime={runtime}>
        <MessageList />
      </ChatRoot>,
    )

    expect(screen.getByRole("button", { name: "Show reasoning" }).closest('[data-slot="reasoning"]')).toBeTruthy()
    expect(screen.getByText("search").closest('[data-slot="toolcall"]')).toBeTruthy()
    expect(screen.getByText("const answer = 42").closest('[data-slot="artifact-code"]')).toBeTruthy()
  })

  it("throws when useChatRuntime is used outside ChatRoot", () => {
    function Consumer() {
      useChatRuntime()
      return null
    }

    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => render(<Consumer />)).toThrowError("useChatRuntime must be used inside ChatRoot")
  })
})
