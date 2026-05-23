import { fireEvent, render, screen, within } from "@testing-library/react"
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
        views: [
          {
            id: "source",
            label: "TypeScript",
            kind: "source",
            language: "ts",
            value: "const answer = 42",
          },
        ],
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

  it("renders runtime attachment parts through the stable attachment slot", () => {
    const runtime = createChatRuntime({ conversationId: "demo" })
    runtime.dispatch({ type: "message.started", messageId: "m1", role: "assistant" })
    runtime.dispatch({
      type: "part.attachment.updated",
      messageId: "m1",
      partId: "p1",
      attachment: {
        id: "file-1",
        name: "report.pdf",
        status: "uploaded",
        remoteUrl: "https://example.com/report.pdf",
      },
    })
    runtime.dispatch({ type: "message.completed", messageId: "m1" })

    render(
      <ChatRoot runtime={runtime}>
        <MessageList />
      </ChatRoot>,
    )

    expect(screen.getByRole("link", { name: "report.pdf" })).toHaveAttribute(
      "href",
      "https://example.com/report.pdf",
    )
    expect(screen.getByRole("link", { name: "report.pdf" }).closest('[data-slot="attachment-part"]')).toBeTruthy()
  })

  it("renders default message and part action rows and calls host callbacks", () => {
    const runtime = createChatRuntime({ conversationId: "demo" })
    const onMessageAction = vi.fn()
    const onPartAction = vi.fn()

    runtime.dispatch({ type: "message.started", messageId: "m1", role: "assistant" })
    runtime.dispatch({ type: "part.text.delta", messageId: "m1", partId: "p1", delta: "Hello" })
    runtime.dispatch({ type: "part.reasoning.delta", messageId: "m1", partId: "p2", delta: "Think" })
    runtime.dispatch({
      type: "part.tool.updated",
      messageId: "m1",
      partId: "p4",
      toolName: "searchDocs",
      status: "complete",
      inputSummary: "query",
      outputSummary: "result",
    })
    runtime.dispatch({
      type: "part.artifact.emitted",
      messageId: "m1",
      partId: "p3",
      artifact: {
        id: "artifact-1",
        kind: "diagram",
        views: [
          {
            id: "preview",
            label: "Preview",
            kind: "preview",
            value: "rendered",
          },
          {
            id: "source",
            label: "Source",
            kind: "source",
            value: "raw",
          },
        ],
      },
    })
    runtime.dispatch({ type: "message.completed", messageId: "m1" })

    render(
      <ChatRoot runtime={runtime} onMessageAction={onMessageAction} onPartAction={onPartAction}>
        <MessageList />
      </ChatRoot>,
    )

    const message = screen.getByText("Hello").closest('[data-slot="message"]')

    expect(message).toBeTruthy()
    expect(within(message as HTMLElement).getByRole("group", { name: "Message feedback" })).toBeTruthy()

    const messageActions = within(message as HTMLElement).getByRole("group", {
      name: "Message actions",
    })
    expect(messageActions).toHaveAttribute("data-slot", "message-actions")
    expect(within(messageActions).getByRole("button", { name: "Copy message" })).toBeTruthy()
    expect(within(messageActions).getByRole("button", { name: "Retry message" })).toBeTruthy()
    expect(within(messageActions).getByRole("button", { name: "Regenerate message" })).toBeTruthy()

    fireEvent.click(within(messageActions).getByRole("button", { name: "Retry message" }))

    expect(onMessageAction).toHaveBeenCalledWith({
      action: "retry",
      messageId: "m1",
      role: "assistant",
    })

    const reasoningActions = screen
      .getByRole("button", { name: "Show reasoning" })
      .closest('[data-slot="message-part"]')

    expect(reasoningActions).toBeTruthy()

    const reasoningActionRow = within(reasoningActions as HTMLElement).getByRole("group", {
      name: "Reasoning part actions",
    })
    expect(reasoningActionRow).toHaveAttribute("data-slot", "part-actions")

    fireEvent.click(within(reasoningActionRow).getByRole("button", { name: "Toggle reasoning" }))

    expect(onPartAction).toHaveBeenCalledWith({
      action: "toggle-reasoning",
      messageId: "m1",
      partId: "p2",
      partKind: "reasoning",
    })

    const toolCallActions = screen.getByText("searchDocs").closest('[data-slot="message-part"]')

    expect(toolCallActions).toBeTruthy()

    const toolCallActionRow = within(toolCallActions as HTMLElement).getByRole("group", {
      name: "Tool call part actions",
    })

    fireEvent.click(within(toolCallActionRow).getByRole("button", { name: "Tool details" }))

    expect(onPartAction).toHaveBeenCalledWith({
      action: "toggle-tool-details",
      messageId: "m1",
      partId: "p4",
      partKind: "tool-call",
    })

    const artifactPart = screen.getByText("rendered").closest('[data-slot="message-part"]')

    expect(artifactPart).toBeTruthy()

    const artifactActionRow = within(artifactPart as HTMLElement).getByRole("group", {
      name: "Artifact part actions",
    })

    fireEvent.click(within(artifactActionRow).getByRole("button", { name: "Open artifact view" }))

    expect(onPartAction).toHaveBeenCalledWith({
      action: "open-artifact-view",
      messageId: "m1",
      partId: "p3",
      partKind: "artifact",
      artifactId: "artifact-1",
      artifactKind: "diagram",
      viewId: "preview",
    })
  })

  it("reports reasoning surface toggles through onPartAction", () => {
    const runtime = createChatRuntime({ conversationId: "demo" })
    const onPartAction = vi.fn()

    runtime.dispatch({ type: "message.started", messageId: "m1", role: "assistant" })
    runtime.dispatch({ type: "part.reasoning.delta", messageId: "m1", partId: "p1", delta: "Think" })
    runtime.dispatch({ type: "message.completed", messageId: "m1" })

    render(
      <ChatRoot runtime={runtime} onPartAction={onPartAction}>
        <MessageList />
      </ChatRoot>,
    )

    fireEvent.click(screen.getByRole("button", { name: "Show reasoning" }))
    fireEvent.click(screen.getByRole("button", { name: "Hide reasoning" }))

    expect(onPartAction).toHaveBeenNthCalledWith(1, {
      action: "toggle-reasoning",
      messageId: "m1",
      partId: "p1",
      partKind: "reasoning",
    })
    expect(onPartAction).toHaveBeenNthCalledWith(2, {
      action: "toggle-reasoning",
      messageId: "m1",
      partId: "p1",
      partKind: "reasoning",
    })
  })

  it("reports tool detail surface toggles through onPartAction", () => {
    const runtime = createChatRuntime({ conversationId: "demo" })
    const onPartAction = vi.fn()

    runtime.dispatch({ type: "message.started", messageId: "m1", role: "assistant" })
    runtime.dispatch({
      type: "part.tool.updated",
      messageId: "m1",
      partId: "p1",
      toolName: "searchDocs",
      status: "complete",
      inputSummary: "query",
      outputSummary: "result",
    })
    runtime.dispatch({ type: "message.completed", messageId: "m1" })

    render(
      <ChatRoot runtime={runtime} onPartAction={onPartAction}>
        <MessageList />
      </ChatRoot>,
    )

    fireEvent.click(screen.getByRole("button", { name: "Show tool details" }))
    fireEvent.click(screen.getByRole("button", { name: "Hide tool details" }))

    expect(onPartAction).toHaveBeenNthCalledWith(1, {
      action: "toggle-tool-details",
      messageId: "m1",
      partId: "p1",
      partKind: "tool-call",
    })
    expect(onPartAction).toHaveBeenNthCalledWith(2, {
      action: "toggle-tool-details",
      messageId: "m1",
      partId: "p1",
      partKind: "tool-call",
    })
  })

  it("reports artifact view changes from the artifact surface through onPartAction", () => {
    const runtime = createChatRuntime({ conversationId: "demo" })
    const onPartAction = vi.fn()

    runtime.dispatch({ type: "message.started", messageId: "m1", role: "assistant" })
    runtime.dispatch({
      type: "part.artifact.emitted",
      messageId: "m1",
      partId: "p1",
      artifact: {
        id: "artifact-1",
        kind: "diagram",
        defaultViewId: "preview",
        views: [
          {
            id: "preview",
            label: "Preview",
            kind: "preview",
            value: "rendered",
          },
          {
            id: "source",
            label: "Source",
            kind: "source",
            value: "raw",
          },
        ],
      },
    })
    runtime.dispatch({ type: "message.completed", messageId: "m1" })

    render(
      <ChatRoot runtime={runtime} onPartAction={onPartAction}>
        <MessageList />
      </ChatRoot>,
    )

    fireEvent.click(screen.getByRole("button", { name: "Source" }))

    expect(screen.getByRole("button", { name: "Source" })).toHaveAttribute("aria-pressed", "true")
    expect(onPartAction).toHaveBeenCalledWith({
      action: "open-artifact-view",
      messageId: "m1",
      partId: "p1",
      partKind: "artifact",
      artifactId: "artifact-1",
      artifactKind: "diagram",
      viewId: "source",
    })
    expect(onPartAction).toHaveBeenCalledTimes(1)
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
