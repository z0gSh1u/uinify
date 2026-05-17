import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { act } from "react"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  type LexicalEditor,
} from "lexical"
import { describe, expect, it, vi } from "vitest"
import { MentionPlugin } from "./mention-plugin"
import { LexicalComposer } from "../lexical-composer"

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

function setEditorText(element: HTMLElement, text: string) {
  setEditorTextWithCaret(element, text, text.length)
}

function setEditorTextWithCaret(element: HTMLElement, text: string, caretOffset: number) {
  const editor = getEditor(element)

  expect(editor).toBeDefined()

  act(() => {
    editor?.update(() => {
      const root = $getRoot()
      const textNode = $createTextNode(text)
      root.clear()
      root.append($createParagraphNode().append(textNode))
      textNode.select(caretOffset, caretOffset)
    })
  })
}

describe("MentionPlugin", () => {
  it("filters mention items when the token starts with an at-sign", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <MentionPlugin
        items={[
          { id: "worker", label: "worker", insertText: "@worker " },
          { id: "writer", label: "writer", insertText: "@writer " },
        ]}
        onSelect={onSelect}
        query="@wo"
      />,
    )

    expect(screen.getByRole("button", { name: "worker" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "writer" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "worker" }))

    expect(onSelect).toHaveBeenCalledWith({
      id: "worker",
      label: "worker",
      insertText: "@worker ",
    })
  })

  it("inserts the selected mention token into the editor", async () => {
    const user = userEvent.setup()

    render(
      <LexicalComposer
        mentions={[{ id: "worker", label: "worker", insertText: "@worker " }]}
        onSubmit={() => undefined}
      />,
    )

    const textbox = screen.getByRole("textbox", { name: "Message" })

    setEditorText(textbox, "@wo")

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "worker" })).toBeInTheDocument()
    })

    await user.click(screen.getByRole("button", { name: "worker" }))

    await waitFor(() => {
      expect(getEditorText(textbox)).toBe("@worker ")
    })
  })

  it("replaces the mention token around the current caret instead of the document tail", async () => {
    const user = userEvent.setup()

    render(
      <LexicalComposer
        mentions={[{ id: "worker", label: "worker", insertText: "@worker " }]}
        onSubmit={() => undefined}
      />,
    )

    const textbox = screen.getByRole("textbox", { name: "Message" })

    setEditorTextWithCaret(textbox, "Prefix @wo middle", 10)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "worker" })).toBeInTheDocument()
    })

    await user.click(screen.getByRole("button", { name: "worker" }))

    await waitFor(() => {
      expect(getEditorText(textbox)).toBe("Prefix @worker middle")
    })
  })
})
