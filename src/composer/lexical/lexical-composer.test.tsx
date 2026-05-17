import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
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

function firePasteWithFiles(element: HTMLElement, files: File[]) {
  fireEvent.paste(element, {
    clipboardData: { files, items: [], types: ["Files"] },
  })
}

describe("LexicalComposer", () => {
  it("renders controlled attachments and delegates remove and retry actions", async () => {
    const user = userEvent.setup()
    const onAttachmentsChange = vi.fn()
    const onAttachmentRetry = vi.fn()
    const file = new File(["hello"], "hello.txt", { type: "text/plain" })

    render(
      <LexicalComposer
        attachments={[
          {
            file,
            id: "a1",
            mimeType: file.type,
            name: "hello.txt",
            size: file.size,
            status: "error",
            error: "Upload failed",
          },
        ]}
        onAttachmentsChange={onAttachmentsChange}
        onAttachmentRetry={onAttachmentRetry}
        onSubmit={() => undefined}
      />,
    )

    expect(screen.getByText("hello.txt")).toBeInTheDocument()
    expect(screen.getByText("Upload failed")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /retry/i }))
    expect(onAttachmentRetry).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a1", status: "error" }),
    )

    await user.click(screen.getByRole("button", { name: /remove/i }))
    expect(onAttachmentsChange).toHaveBeenCalledWith([])
  })

  it("blocks submit when uploaded-only policy still has queued attachments", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const file = new File(["hello"], "hello.txt", { type: "text/plain" })

    render(
      <LexicalComposer
        attachments={[
          {
            file,
            id: "a1",
            mimeType: file.type,
            name: "hello.txt",
            size: file.size,
            status: "queued",
          },
        ]}
        onSubmit={onSubmit}
        sendPolicy="uploaded-only"
      />,
    )

    const textbox = screen.getByRole("textbox", { name: "Message" })
    setEditorText(textbox, "Hello world")

    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("blocks submit when uploaded-only policy still has uploading attachments", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const file = new File(["hello"], "hello.txt", { type: "text/plain" })

    render(
      <LexicalComposer
        attachments={[
          {
            file,
            id: "a1",
            mimeType: file.type,
            name: "hello.txt",
            progress: 50,
            size: file.size,
            status: "uploading",
          },
        ]}
        onSubmit={onSubmit}
        sendPolicy="uploaded-only"
      />,
    )

    const textbox = screen.getByRole("textbox", { name: "Message" })
    setEditorText(textbox, "Hello world")

    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("blocks submit when uploaded-only policy has error attachments", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const file = new File(["hello"], "hello.txt", { type: "text/plain" })

    render(
      <LexicalComposer
        attachments={[
          {
            error: "Upload failed",
            file,
            id: "a1",
            mimeType: file.type,
            name: "hello.txt",
            size: file.size,
            status: "error",
          },
        ]}
        onSubmit={onSubmit}
        sendPolicy="uploaded-only"
      />,
    )

    const textbox = screen.getByRole("textbox", { name: "Message" })
    setEditorText(textbox, "Hello world")

    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("excludes removed attachments from the submit payload", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const file = new File(["hello"], "hello.txt", { type: "text/plain" })

    render(
      <LexicalComposer
        initialAttachments={[
          {
            file,
            id: "a1",
            mimeType: file.type,
            name: "hello.txt",
            size: file.size,
            status: "uploaded",
          },
          {
            file,
            id: "a2",
            mimeType: file.type,
            name: "removed.txt",
            size: file.size,
            status: "removed",
          },
        ]}
        onSubmit={onSubmit}
      />,
    )

    const textbox = screen.getByRole("textbox", { name: "Message" })
    setEditorText(textbox, "Hello world")

    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      text: "Hello world",
      attachments: [
        {
          file,
          id: "a1",
          mimeType: file.type,
          name: "hello.txt",
          size: file.size,
          status: "uploaded",
        },
      ],
      commands: [],
      mentions: [],
    })
  })

  it("preserves rapid successive uncontrolled attachment updates", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onAttachmentsChange = vi.fn()
    const firstFile = new File(["first"], "first.txt", { type: "text/plain" })
    const secondFile = new File(["second"], "second.txt", { type: "text/plain" })

    render(<LexicalComposer onAttachmentsChange={onAttachmentsChange} onSubmit={onSubmit} />)

    const textbox = screen.getByRole("textbox", { name: "Message" })

    act(() => {
      firePasteWithFiles(textbox, [firstFile])
      firePasteWithFiles(textbox, [secondFile])
    })

    expect(screen.getByText("first.txt")).toBeInTheDocument()
    expect(screen.getByText("second.txt")).toBeInTheDocument()
    expect(onAttachmentsChange).toHaveBeenNthCalledWith(
      2,
      expect.arrayContaining([
        expect.objectContaining({ name: "first.txt" }),
        expect.objectContaining({ name: "second.txt" }),
      ]),
    )

    await user.click(screen.getAllByRole("button", { name: /remove/i })[0]!)

    setEditorText(textbox, "Hello world")
    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0]?.[0].attachments).toHaveLength(1)
    expect(onSubmit.mock.calls[0]?.[0].attachments[0]).toEqual(
      expect.objectContaining({ name: "second.txt" }),
    )
  })

  it("submits plain text and initial attachments through the real editor shell", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const file = new File(["hello"], "hello.txt", { type: "text/plain" })

    render(
      <LexicalComposer
        initialAttachments={[
          {
            file,
            id: "a1",
            mimeType: file.type,
            name: "hello.txt",
            size: file.size,
            status: "uploaded",
          },
        ]}
        onSubmit={onSubmit}
      />,
    )

    const textbox = screen.getByRole("textbox", { name: "Message" })

    setEditorText(textbox, "Hello world")

    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      text: "Hello world",
      attachments: [
        {
          file,
          id: "a1",
          mimeType: file.type,
          name: "hello.txt",
          size: file.size,
          status: "uploaded",
        },
      ],
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
        initialAttachments={[
          {
            file,
            id: "a1",
            mimeType: file.type,
            name: "hello.txt",
            size: file.size,
            status: "uploaded",
          },
        ]}
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

  it("derives commands and mentions from the final text snapshot on submit", async () => {
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

    setEditorText(textbox, "manual /agent @worker")
    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      text: "manual /agent @worker",
      attachments: [],
      commands: ["agent"],
      mentions: ["worker"],
    })
  })

  it("does not submit stale command or mention ids after the final text changes", async () => {
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

    setEditorText(textbox, "manual /age @workerish")
    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      text: "manual /age @workerish",
      attachments: [],
      commands: [],
      mentions: [],
    })
  })
})
