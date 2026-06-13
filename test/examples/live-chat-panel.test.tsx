import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { CSSProperties, ReactNode } from "react"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  type LexicalEditor,
} from "lexical"
import { afterEach, describe, expect, it, vi } from "vitest"
import { LiveChatPanel } from "../../examples/src/chat/live/LiveChatPanel"
import type { UiMessage } from "../../src/model/types"

vi.mock("react-virtuoso", () => ({
  Virtuoso: ({
    computeItemKey,
    data,
    itemContent,
    style,
    totalCount,
  }: {
    computeItemKey?: (index: number, message: UiMessage) => string
    data: UiMessage[]
    itemContent: (index: number, message?: UiMessage) => ReactNode
    style?: CSSProperties
    totalCount: number
  }) => (
    <div data-testid="virtuoso-mock" data-count={totalCount} style={style}>
      {data.map((message, index) => (
        <div key={computeItemKey?.(index, message) ?? index}>{itemContent(index, message)}</div>
      ))}
    </div>
  ),
}))

afterEach(() => {
  vi.unstubAllGlobals()
})

function setEditorText(element: HTMLElement, text: string) {
  const editor = (element as HTMLElement & { __lexicalEditor?: LexicalEditor }).__lexicalEditor

  expect(editor).toBeDefined()

  act(() => {
    editor?.update(() => {
      const root = $getRoot()
      const textNode = $createTextNode(text)

      root.clear()
      root.append($createParagraphNode().append(textNode))
      textNode.select(text.length, text.length)
    })
  })
}

function createSSEStream(events: string[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder()

      for (const event of events) {
        controller.enqueue(encoder.encode(event))
      }

      controller.close()
    },
  })
}

function uiFrame(data: unknown) {
  return `event: ui\ndata: ${JSON.stringify(data)}\n\n`
}

describe("LiveChatPanel", () => {
  it("renders the uinify Lexical message composer and image attachment control", () => {
    render(<LiveChatPanel />)

    expect(screen.getByRole("heading", { name: /live multimodal chat/i })).toBeInTheDocument()
    expect(screen.getByTestId("virtuoso-mock")).toHaveAttribute("data-count", "0")
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveAttribute(
      "data-slot",
      "composer-editor",
    )
    expect(screen.getByRole("button", { name: "Attach" })).toHaveAttribute(
      "data-slot",
      "composer-attachment-button",
    )
    expect(screen.getByLabelText("Attach file")).toHaveAttribute("accept", "image/*")
  })

  it("shows slash and mention command options from the live chat command set", async () => {
    render(<LiveChatPanel />)

    const textbox = screen.getByRole("textbox", { name: "Message" })

    setEditorText(textbox, "/")

    expect(await screen.findByRole("button", { name: "Analyze image" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Summarize" })).toBeInTheDocument()

    setEditorText(textbox, "@")

    expect(await screen.findByRole("button", { name: "@vision" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "@writer" })).toBeInTheDocument()
  })

  it("submits text to the chat API and streams assistant text into the transcript", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(
        createSSEStream([
          "event: ping\ndata: ignored\n\n",
          uiFrame({
            type: "message.started",
            messageId: "assistant-test",
            role: "assistant",
          }),
          uiFrame({
            type: "part.text.delta",
            messageId: "assistant-test",
            partId: "assistant-test-text",
            delta: "Hello ",
          }),
          uiFrame({
            type: "part.text.delta",
            messageId: "assistant-test",
            partId: "assistant-test-text",
            delta: "from the assistant.",
          }),
          uiFrame({
            type: "message.completed",
            messageId: "assistant-test",
          }),
        ]),
      ),
    )

    vi.stubGlobal("fetch", fetchMock)
    render(<LiveChatPanel />)

    const textbox = screen.getByRole("textbox", { name: "Message" })

    setEditorText(textbox, "Hello live chat")
    await user.click(screen.getByRole("button", { name: "Send" }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/chat",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      )
    })

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(JSON.parse(String(request.body))).toEqual({
      messages: [{ role: "user", content: "Hello live chat" }],
    })
    expect(await screen.findByText("Hello live chat")).toBeInTheDocument()
    expect(await screen.findByText("Hello from the assistant.")).toBeInTheDocument()
  })
})
