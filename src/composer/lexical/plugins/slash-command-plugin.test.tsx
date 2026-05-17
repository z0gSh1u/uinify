import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { act } from "react"
import { $createParagraphNode, $createTextNode, $getRoot, type LexicalEditor } from "lexical"
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
})
