import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { act } from "react"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $setSelection,
  type LexicalEditor,
  type TextNode,
} from "lexical"
import { describe, expect, it, vi } from "vitest"
import { SlashCommandPlugin } from "./slash-command-plugin"
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

describe("SlashCommandPlugin", () => {
  it("filters slash items when the token starts with a slash", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <SlashCommandPlugin
        items={[
          { id: "agent", label: "agent", insertText: "/agent " },
          { id: "draft", label: "draft", insertText: "/draft " },
        ]}
        onSelect={onSelect}
        query="/ag"
      />, 
    )

    expect(screen.getByRole("button", { name: "agent" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "draft" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "agent" }))

    expect(onSelect).toHaveBeenCalledWith({
      id: "agent",
      label: "agent",
      insertText: "/agent ",
    })
  })

  it("inserts the selected slash command into the editor", async () => {
    const user = userEvent.setup()

    render(
      <LexicalComposer
        onSubmit={() => undefined}
        slashCommands={[{ id: "agent", label: "agent", insertText: "/agent " }]}
      />, 
    )

    const textbox = screen.getByRole("textbox", { name: "Message" })

    setEditorText(textbox, "/ag")

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "agent" })).toBeInTheDocument()
    })

    await user.click(screen.getByRole("button", { name: "agent" }))

    await waitFor(() => {
      expect(getEditorText(textbox)).toBe("/agent ")
    })
  })

  it("replaces the slash token around the current caret instead of the document tail", async () => {
    const user = userEvent.setup()

    render(
      <LexicalComposer
        onSubmit={() => undefined}
        slashCommands={[{ id: "agent", label: "agent", insertText: "/agent " }]}
      />,
    )

    const textbox = screen.getByRole("textbox", { name: "Message" })

    setEditorTextWithCaret(textbox, "Prefix /ag middle", 10)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "agent" })).toBeInTheDocument()
    })

    await user.click(screen.getByRole("button", { name: "agent" }))

    await waitFor(() => {
      expect(getEditorText(textbox)).toBe("Prefix /agent middle")
    })
  })

  it("replaces the slash token in the active paragraph for multi-paragraph content", async () => {
    const user = userEvent.setup()

    render(
      <LexicalComposer
        onSubmit={() => undefined}
        slashCommands={[{ id: "agent", label: "agent", insertText: "/agent " }]}
      />,
    )

    const textbox = screen.getByRole("textbox", { name: "Message" })

    setEditorParagraphsWithCaret(textbox, ["First line", "Second /ag line"], 1, 10)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "agent" })).toBeInTheDocument()
    })

    await user.click(screen.getByRole("button", { name: "agent" }))

    await waitFor(() => {
      expect(getEditorText(textbox)).toBe("First line\n\nSecond /agent line")
    })
  })

  it("preserves multi-paragraph structure in the fallback path when selection is lost", async () => {
    const user = userEvent.setup()

    render(
      <LexicalComposer
        onSubmit={() => undefined}
        slashCommands={[{ id: "agent", label: "agent", insertText: "/agent " }]}
      />,
    )

    const textbox = screen.getByRole("textbox", { name: "Message" })

    setEditorParagraphsWithCaret(textbox, ["First line", "Second /ag line"], 1, 10)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "agent" })).toBeInTheDocument()
    })

    const button = screen.getByRole("button", { name: "agent" })

    act(() => {
      getEditor(textbox)?.update(() => {
        $setSelection(null)
      })
      fireEvent.click(button)
    })

    await waitFor(() => {
      expect(getEditorText(textbox)).toBe("First line\n\nSecond /agent line")
    })
  })
})
