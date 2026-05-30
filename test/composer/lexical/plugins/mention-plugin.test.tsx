import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { act } from "react"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $setSelection,
  type LexicalEditor,
} from "lexical"
import { describe, expect, it, vi } from "vitest"
import { MentionPlugin } from "../../../../src/composer/lexical/plugins/mention-plugin"
import { LexicalComposer } from "../../../../src/composer/lexical/lexical-composer"

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

function setEditorParagraphsWithCaret(
  element: HTMLElement,
  paragraphs: readonly string[],
  paragraphIndex: number,
  caretOffset: number,
) {
  const editor = getEditor(element)

  expect(editor).toBeDefined()

  act(() => {
    editor?.update(() => {
      const root = $getRoot()
      root.clear()

      paragraphs.forEach((paragraphText, index) => {
        const textNode = $createTextNode(paragraphText)
        root.append($createParagraphNode().append(textNode))

        if (index === paragraphIndex) {
          textNode.select(caretOffset, caretOffset)
        }
      })
    })
  })
}

describe("MentionPlugin", () => {
  it("filters mention items when the token starts with an at-sign", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <MentionPlugin
        commands={[
          { id: "worker", kind: "mention", label: "worker", insertText: "@worker ", trigger: "@" },
          { id: "writer", kind: "mention", label: "writer", insertText: "@writer ", trigger: "@" },
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
      kind: "mention",
      label: "worker",
      insertText: "@worker ",
      trigger: "@",
    })
  })

  it("inserts the selected mention token into the editor", async () => {
    const user = userEvent.setup()

    render(
      <LexicalComposer
        commands={[{ id: "worker", kind: "mention", label: "worker", insertText: "@worker ", trigger: "@" }]}
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
        commands={[{ id: "worker", kind: "mention", label: "worker", insertText: "@worker ", trigger: "@" }]}
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

  it("replaces the mention token in the active paragraph for multi-paragraph content", async () => {
    const user = userEvent.setup()

    render(
      <LexicalComposer
        commands={[{ id: "worker", kind: "mention", label: "worker", insertText: "@worker ", trigger: "@" }]}
        onSubmit={() => undefined}
      />,
    )

    const textbox = screen.getByRole("textbox", { name: "Message" })

    setEditorParagraphsWithCaret(textbox, ["First line", "Second @wo line"], 1, 10)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "worker" })).toBeInTheDocument()
    })

    await user.click(screen.getByRole("button", { name: "worker" }))

    await waitFor(() => {
      expect(getEditorText(textbox)).toBe("First line\n\nSecond @worker line")
    })
  })

  it("preserves multi-paragraph structure in the fallback path when selection is lost", async () => {
    const user = userEvent.setup()

    render(
      <LexicalComposer
        commands={[{ id: "worker", kind: "mention", label: "worker", insertText: "@worker ", trigger: "@" }]}
        onSubmit={() => undefined}
      />,
    )

    const textbox = screen.getByRole("textbox", { name: "Message" })

    setEditorParagraphsWithCaret(textbox, ["First line", "Second @wo line"], 1, 10)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "worker" })).toBeInTheDocument()
    })

    const button = screen.getByRole("button", { name: "worker" })

    act(() => {
      getEditor(textbox)?.update(() => {
        $setSelection(null)
      })
      fireEvent.click(button)
    })

    await waitFor(() => {
      expect(getEditorText(textbox)).toBe("First line\n\nSecond @worker line")
    })
  })
})
