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
      const textNode = $createTextNode(text)
      root.clear()
      root.append($createParagraphNode().append(textNode))
      textNode.select(text.length, text.length)
    })
  })
}

function getEditor(element: HTMLElement) {
  return (element as HTMLElement & { __lexicalEditor?: LexicalEditor }).__lexicalEditor
}

function getEditorText(element: HTMLElement) {
  let text = ""
  const editor = getEditor(element)

  editor?.getEditorState().read(() => {
    text = $getRoot().getTextContent()
  })

  return text
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

  it("submits selected slash commands and mentions", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <LexicalComposer
        mentions={[{ id: "worker", label: "worker", insertText: "@worker " }]}
        onSubmit={onSubmit}
        slashCommands={[{ id: "agent", label: "agent", insertText: "/agent " }]}
      />,
    )

    const textbox = screen.getByRole("textbox", { name: "Message" })

    setEditorText(textbox, "/ag")

    await user.click(await screen.findByRole("button", { name: "agent" }))

    await waitFor(() => {
      expect(getEditorText(textbox)).toBe("/agent ")
    })

    setEditorText(textbox, "/agent @wo")

    await user.click(await screen.findByRole("button", { name: "worker" }))

    await waitFor(() => {
      expect(getEditorText(textbox)).toBe("/agent @worker ")
    })

    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      text: "/agent @worker ",
      attachments: [],
      commands: ["agent"],
      mentions: ["worker"],
    })
  })
})
