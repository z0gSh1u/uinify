import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  UNDO_COMMAND,
  type LexicalEditor,
} from "lexical"
import { describe, expect, it, vi } from "vitest"
import { LexicalComposer } from "./lexical-composer"

function setEditorText(element: HTMLElement, text: string) {
  const editor = getEditor(element)

  expect(editor).toBeDefined()

  act(() => {
    editor?.update(() => {
      const root = $getRoot()
      root.clear()
      root.append($createParagraphNode().append($createTextNode(text)))
    })
  })
}

function getEditor(element: HTMLElement) {
  return (element as HTMLElement & { __lexicalEditor?: LexicalEditor }).__lexicalEditor
}

describe("LexicalComposer", () => {
  it("submits plain text and initial attachments through the real editor shell", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const file = new File(["hello"], "hello.txt", { type: "text/plain" })

    render(
      <LexicalComposer
        initialAttachments={[{ id: "a1", file, status: "ready" }]}
        onSubmit={onSubmit}
      />,
    )

    const textbox = screen.getByRole("textbox", { name: "Message" })

    setEditorText(textbox, "Hello world")

    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      text: "Hello world",
      attachments: [{ id: "a1", file, status: "ready" }],
      commands: [],
      mentions: [],
    })
  })

  it("clears text and attachments after submit", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const file = new File(["hello"], "hello.txt", { type: "text/plain" })

    render(
      <LexicalComposer
        initialAttachments={[{ id: "a1", file, status: "ready" }]}
        onSubmit={onSubmit}
      />,
    )

    const textbox = screen.getByRole("textbox", { name: "Message" })

    setEditorText(textbox, "Hello world")

    await user.click(screen.getByRole("button", { name: /send/i }))

    await waitFor(() => {
      expect(textbox).toHaveTextContent("")
      expect(screen.queryByText("hello.txt")).not.toBeInTheDocument()
    })
  })

  it("does not restore submitted text when undo runs after submit", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<LexicalComposer onSubmit={onSubmit} />)

    const textbox = screen.getByRole("textbox", { name: "Message" })
    const editor = getEditor(textbox)

    setEditorText(textbox, "Hello world")

    await user.click(screen.getByRole("button", { name: /send/i }))

    await waitFor(() => {
      expect(textbox).toHaveTextContent("")
    })

    act(() => {
      editor?.dispatchCommand(UNDO_COMMAND, undefined)
    })

    await waitFor(() => {
      expect(textbox).toHaveTextContent("")
    })
  })
})
