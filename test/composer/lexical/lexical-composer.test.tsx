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
import type { UiComposerAttachment, UiComposerCommand, UiComposerCommandSelection, UiComposerValue } from "../../../src/composer/contracts"
import { LexicalComposer } from "../../../src/composer/lexical/lexical-composer"

const commandTypeFixture = {
  id: "agent-research",
  kind: "agent",
  label: "Researcher",
  insertText: "@researcher ",
  trigger: "@",
  description: "Route to the research subagent",
  group: "Agents",
  metadata: { agentId: "researcher" },
} satisfies UiComposerCommand

const commandSelectionTypeFixture = {
  id: "agent-research",
  kind: "agent",
  label: "Researcher",
  insertText: "@researcher ",
  trigger: "@",
  range: { start: 0, end: 12 },
  description: "Route to the research subagent",
  group: "Agents",
  metadata: { agentId: "researcher" },
} satisfies UiComposerCommandSelection

void commandTypeFixture
void commandSelectionTypeFixture

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

    expect(screen.getByRole("button", { name: /send/i })).toHaveAttribute(
      "data-send-blocked-reason",
      "attachments-not-uploaded",
    )

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

    expect(screen.getByRole("button", { name: /send/i })).toHaveAttribute(
      "data-send-blocked-reason",
      "attachments-uploading",
    )

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

  it("surfaces rejected attachments from host validation", async () => {
    const user = userEvent.setup()
    const allowedFile = new File(["hello"], "hello.txt", { type: "text/plain" })
    const rejectedFile = new File(["blocked"], "blocked.txt", { type: "text/plain" })

    render(
      <LexicalComposer
        onAttachmentValidation={(attachments) =>
          attachments.map((attachment) =>
            attachment.name === "blocked.txt"
              ? {
                  ok: false,
                  attachment: {
                    id: `${attachment.id}-rejected`,
                    name: attachment.name,
                    mimeType: attachment.mimeType,
                    size: attachment.size,
                    sourceAttachmentId: attachment.id,
                    status: "error",
                    rejection: {
                      code: "invalid-type",
                      message: "Blocked by host",
                    },
                  },
                }
              : { ok: true, attachment },
          )
        }
        onSubmit={() => undefined}
      />,
    )

    firePasteWithFiles(screen.getByRole("textbox", { name: "Message" }), [allowedFile, rejectedFile])

    expect(screen.getByText("hello.txt")).toBeInTheDocument()
    expect(screen.getByText("blocked.txt")).toBeInTheDocument()
    expect(screen.getByText("Blocked by host")).toBeInTheDocument()

    await user.click(screen.getAllByRole("button", { name: /remove/i })[1]!)
    expect(screen.queryByText("blocked.txt")).not.toBeInTheDocument()
  })

  it("excludes rejected attachments from the submit payload", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const allowedFile = new File(["hello"], "hello.txt", { type: "text/plain" })
    const rejectedFile = new File(["blocked"], "blocked.txt", { type: "text/plain" })

    render(
      <LexicalComposer
        onAttachmentValidation={(attachments) =>
          attachments.map((attachment) =>
            attachment.name === "blocked.txt"
              ? {
                  ok: false,
                  attachment: {
                    id: `${attachment.id}-rejected`,
                    name: attachment.name,
                    mimeType: attachment.mimeType,
                    size: attachment.size,
                    sourceAttachmentId: attachment.id,
                    status: "error",
                    rejection: {
                      code: "invalid-type",
                      message: "Blocked by host",
                    },
                  },
                }
              : { ok: true, attachment },
          )
        }
        onSubmit={onSubmit}
      />,
    )

    const textbox = screen.getByRole("textbox", { name: "Message" })

    firePasteWithFiles(textbox, [allowedFile, rejectedFile])
    setEditorText(textbox, "Hello world")

    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      text: "Hello world",
      attachments: [expect.objectContaining({ name: "hello.txt", status: "queued" })],
      commands: [],
    })
  })

  it("submits pasted image attachments with file metadata", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onAttachmentRetry = vi.fn()
    const onAttachmentCancel = vi.fn()
    const file = new File(["image-bytes"], "diagram.png", { type: "image/png" })

    render(
      <LexicalComposer
        onAttachmentCancel={onAttachmentCancel}
        onAttachmentRetry={onAttachmentRetry}
        onSubmit={onSubmit}
      />,
    )

    const textbox = screen.getByRole("textbox", { name: "Message" })
    firePasteWithFiles(textbox, [file])
    setEditorText(textbox, "Describe this diagram")

    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      text: "Describe this diagram",
      attachments: [
        expect.objectContaining({
          file,
          name: "diagram.png",
          mimeType: "image/png",
          size: file.size,
          status: "queued",
        }),
      ],
      commands: [],
    })
    expect(onAttachmentRetry).not.toHaveBeenCalled()
    expect(onAttachmentCancel).not.toHaveBeenCalled()
  })

  it("queues selected files from the visible attachment control", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const file = new File(["image-bytes"], "selected.png", { type: "image/png" })

    render(<LexicalComposer attachmentAccept="image/*" onSubmit={onSubmit} />)

    const attachmentInput = screen.getByLabelText("Attach file")

    expect(screen.getByRole("button", { name: "Attach" })).toBeInTheDocument()
    expect(attachmentInput).toHaveAttribute("accept", "image/*")

    await user.upload(attachmentInput, file)

    expect(screen.getByText("selected.png")).toBeInTheDocument()

    const textbox = screen.getByRole("textbox", { name: "Message" })
    setEditorText(textbox, "Describe this selected image")

    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      text: "Describe this selected image",
      attachments: [expect.objectContaining({ file, name: "selected.png", status: "queued" })],
      commands: [],
    })
  })

  it("submits pasted image attachments with fallback names when browsers omit file names", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const file = new File(["image-bytes"], "", { type: "image/png" })

    render(<LexicalComposer onSubmit={onSubmit} />)

    const textbox = screen.getByRole("textbox", { name: "Message" })
    firePasteWithFiles(textbox, [file])
    setEditorText(textbox, "Describe this pasted image")

    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      text: "Describe this pasted image",
      attachments: [
        expect.objectContaining({
          file,
          name: "pasted-image.png",
          mimeType: "image/png",
          size: file.size,
          status: "queued",
        }),
      ],
      commands: [],
    })
  })

  it("submits pasted non-image attachments with file metadata", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const file = new File(["hello"], "hello.txt", { type: "text/plain" })

    render(<LexicalComposer onSubmit={onSubmit} />)

    const textbox = screen.getByRole("textbox", { name: "Message" })
    firePasteWithFiles(textbox, [file])
    setEditorText(textbox, "Read this file")

    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      text: "Read this file",
      attachments: [
        expect.objectContaining({
          file,
          name: "hello.txt",
          mimeType: "text/plain",
          size: file.size,
          status: "queued",
        }),
      ],
      commands: [],
    })
  })

  it("submits pasted non-image attachments with fallback names when browsers omit file names", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const file = new File(["notes"], "", { type: "text/plain" })

    render(<LexicalComposer onSubmit={onSubmit} />)

    const textbox = screen.getByRole("textbox", { name: "Message" })
    firePasteWithFiles(textbox, [file])
    setEditorText(textbox, "Read this pasted file")

    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      text: "Read this pasted file",
      attachments: [
        expect.objectContaining({
          file,
          name: "pasted-file.txt",
          mimeType: "text/plain",
          size: file.size,
          status: "queued",
        }),
      ],
      commands: [],
    })
  })

  it("delegates cancel intent for uploading attachments", async () => {
    const user = userEvent.setup()
    const onAttachmentCancel = vi.fn()
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
        onAttachmentCancel={onAttachmentCancel}
        onSubmit={() => undefined}
      />,
    )

    await user.click(screen.getByRole("button", { name: /remove/i }))

    expect(onAttachmentCancel).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a1", status: "uploading" }),
    )
  })

  it("removes uploading attachments locally when no cancel hook is provided", async () => {
    const user = userEvent.setup()
    const file = new File(["hello"], "hello.txt", { type: "text/plain" })

    render(
      <LexicalComposer
        initialAttachments={[
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
        onSubmit={() => undefined}
      />,
    )

    await user.click(screen.getByRole("button", { name: /remove/i }))

    expect(screen.queryByText("hello.txt")).not.toBeInTheDocument()
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

  it("preserves successive updates after validation callback changes", () => {
    const firstFile = new File(["first"], "first.txt", { type: "text/plain" })
    const secondFile = new File(["second"], "second.txt", { type: "text/plain" })
    const firstValidation = vi.fn((attachments: UiComposerAttachment[]) =>
      attachments.map((attachment) => ({ ok: true as const, attachment })),
    )
    const secondValidation = vi.fn((attachments: UiComposerAttachment[]) =>
      attachments.map((attachment) => ({ ok: true as const, attachment })),
    )

    const { rerender } = render(
      <LexicalComposer onAttachmentValidation={firstValidation} onSubmit={() => undefined} />,
    )

    const textbox = screen.getByRole("textbox", { name: "Message" })

    firePasteWithFiles(textbox, [firstFile])

    rerender(<LexicalComposer onAttachmentValidation={secondValidation} onSubmit={() => undefined} />)

    firePasteWithFiles(screen.getByRole("textbox", { name: "Message" }), [secondFile])

    expect(firstValidation).toHaveBeenCalledTimes(1)
    expect(secondValidation).toHaveBeenCalledTimes(1)
    expect(screen.getByText("first.txt")).toBeInTheDocument()
    expect(screen.getByText("second.txt")).toBeInTheDocument()
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

  it("submits selected unified commands with metadata and ranges", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <LexicalComposer
        commands={[
          {
            id: "agent-research",
            kind: "agent",
            label: "Researcher",
            insertText: "@researcher ",
            trigger: "@",
            metadata: { agentId: "researcher" },
          },
          {
            id: "slash-draft",
            kind: "slash",
            label: "draft",
            insertText: "/draft ",
            trigger: "/",
          },
        ]}
        onSubmit={onSubmit}
      />,
    )

    const textbox = screen.getByRole("textbox", { name: "Message" })

    setEditorText(textbox, "/dr")

    await user.click(await screen.findByRole("button", { name: /draft/i }))

    await waitFor(() => {
      expect(getEditorText(textbox)).toBe("/draft ")
    })

    setEditorText(textbox, "/draft @res")

    await user.click(await screen.findByRole("button", { name: /Researcher/i }))

    await waitFor(() => {
      expect(getEditorText(textbox)).toBe("/draft @researcher ")
    })

    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      text: "/draft @researcher ",
      attachments: [],
      commands: [
        {
          id: "slash-draft",
          kind: "slash",
          label: "draft",
          insertText: "/draft ",
          trigger: "/",
          range: { start: 0, end: 7 },
        },
        {
          id: "agent-research",
          kind: "agent",
          label: "Researcher",
          insertText: "@researcher ",
          trigger: "@",
          range: { start: 7, end: 19 },
          metadata: { agentId: "researcher" },
        },
      ],
    })
  })

  it("shifts existing selected command ranges when inserting a command before them", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <LexicalComposer
        commands={[
          { id: "agent-research", kind: "agent", label: "Researcher", insertText: "@researcher ", trigger: "@" },
          { id: "slash-draft", kind: "slash", label: "draft", insertText: "/draft ", trigger: "/" },
        ]}
        onSubmit={onSubmit}
      />,
    )

    const textbox = screen.getByRole("textbox", { name: "Message" })

    setEditorText(textbox, "@res later /dr")
    await user.click(await screen.findByRole("button", { name: /draft/i }))

    await waitFor(() => {
      expect(getEditorText(textbox)).toBe("@res later /draft ")
    })

    setEditorTextWithCaret(textbox, "@res later /draft ", 4)
    await user.click(await screen.findByRole("button", { name: /Researcher/i }))

    await waitFor(() => {
      expect(getEditorText(textbox)).toBe("@researcher later /draft ")
    })

    await user.click(screen.getByRole("button", { name: /send/i }))

    const submitValue = onSubmit.mock.calls[0]?.[0] as UiComposerValue | undefined

    expect(submitValue).toEqual({
      text: "@researcher later /draft ",
      attachments: [],
      commands: [
        expect.objectContaining({ id: "slash-draft", range: { start: 18, end: 25 } }),
        expect.objectContaining({ id: "agent-research", range: { start: 0, end: 12 } }),
      ],
    })
    expect(submitValue?.commands.map((command) => submitValue.text.slice(command.range.start, command.range.end))).toEqual([
      "/draft ",
      "@researcher ",
    ])
  })

  it("shifts selected command ranges when text is inserted before them", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <LexicalComposer
        commands={[{ id: "slash-draft", kind: "slash", label: "draft", insertText: "/draft ", trigger: "/" }]}
        onSubmit={onSubmit}
      />,
    )

    const textbox = screen.getByRole("textbox", { name: "Message" })

    setEditorText(textbox, "/dr")
    await user.click(await screen.findByRole("button", { name: /draft/i }))
    await waitFor(() => {
      expect(getEditorText(textbox)).toBe("/draft ")
    })

    setEditorText(textbox, "Please /draft ")
    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      text: "Please /draft ",
      attachments: [],
      commands: [expect.objectContaining({ id: "slash-draft", range: { start: 7, end: 14 } })],
    })
  })

  it("does not infer unselected commands by parsing manually typed text", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <LexicalComposer
        commands={[
          { id: "agent-research", kind: "agent", label: "Researcher", insertText: "@researcher ", trigger: "@" },
          { id: "slash-draft", kind: "slash", label: "draft", insertText: "/draft ", trigger: "/" },
        ]}
        onSubmit={onSubmit}
      />,
    )

    const textbox = screen.getByRole("textbox", { name: "Message" })

    setEditorText(textbox, "manual /draft @researcher")
    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      text: "manual /draft @researcher",
      attachments: [],
      commands: [],
    })
  })

  it("drops selected commands whose inserted range no longer matches the final text", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <LexicalComposer
        commands={[{ id: "slash-draft", kind: "slash", label: "draft", insertText: "/draft ", trigger: "/" }]}
        onSubmit={onSubmit}
      />,
    )

    const textbox = screen.getByRole("textbox", { name: "Message" })

    setEditorText(textbox, "/dr")
    await user.click(await screen.findByRole("button", { name: /draft/i }))
    await waitFor(() => {
      expect(getEditorText(textbox)).toBe("/draft ")
    })

    setEditorText(textbox, "manual /dra")
    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      text: "manual /dra",
      attachments: [],
      commands: [],
    })
  })

  it("does not select disabled commands", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <LexicalComposer
        commands={[
          {
            id: "tool-search",
            kind: "tool",
            label: "Search",
            insertText: "/search ",
            trigger: "/",
            disabledReason: "Connect MCP first",
          },
        ]}
        onSubmit={onSubmit}
      />,
    )

    const textbox = screen.getByRole("textbox", { name: "Message" })

    setEditorText(textbox, "/sea")

    const commandButton = await screen.findByRole("button", { name: /Search/i })

    expect(commandButton).toBeDisabled()

    await user.click(commandButton)
    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      text: "/sea",
      attachments: [],
      commands: [],
    })
  })
})
