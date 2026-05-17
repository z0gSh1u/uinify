import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { collectAttachments, createAttachmentHandlers } from "./attachment-plugin"
import { LexicalComposer } from "../lexical-composer"

describe("attachment-plugin", () => {
  it("collectAttachments creates ready attachments with unique ids across calls", () => {
    const file = new File(["hello"], "hello.txt", { type: "text/plain" })
    const first = collectAttachments([file])
    const second = collectAttachments([file])

    expect(first).toEqual([
      expect.objectContaining({
        file,
        status: "ready",
      }),
    ])
    expect(second).toEqual([
      expect.objectContaining({
        file,
        status: "ready",
      }),
    ])
    expect(first[0]?.id).not.toBe(second[0]?.id)
  })

  it("createAttachmentHandlers only prevents default when handling file attachments", () => {
    const onAdd = vi.fn()
    const file = new File(["hello"], "hello.txt", { type: "text/plain" })
    const handlers = createAttachmentHandlers(onAdd)
    const preventPasteDefault = vi.fn()
    const preventFileDropDefault = vi.fn()
    const preventTextDropDefault = vi.fn()

    handlers.onPaste({ clipboardData: { files: [file] }, preventDefault: preventPasteDefault } as never)
    handlers.onDrop({ dataTransfer: { files: [file] }, preventDefault: preventFileDropDefault } as never)
    handlers.onDrop({ dataTransfer: { files: [] }, preventDefault: preventTextDropDefault } as never)

    expect(onAdd).toHaveBeenCalledTimes(2)
    expect(onAdd.mock.calls[0]?.[0][0]).toEqual(
      expect.objectContaining({ file, status: "ready" }),
    )
    expect(onAdd.mock.calls[1]?.[0][0]).toEqual(
      expect.objectContaining({ file, status: "ready" }),
    )
    expect(onAdd.mock.calls[0]?.[0][0].id).not.toBe(onAdd.mock.calls[1]?.[0][0].id)
    expect(preventPasteDefault).toHaveBeenCalledTimes(1)
    expect(preventFileDropDefault).toHaveBeenCalledTimes(1)
    expect(preventTextDropDefault).not.toHaveBeenCalled()
  })

  it("createAttachmentHandlers ignores non-file paste events", () => {
    const onAdd = vi.fn()
    const preventDefault = vi.fn()
    const handlers = createAttachmentHandlers(onAdd)

    handlers.onPaste({ clipboardData: { files: [] }, preventDefault } as never)

    expect(onAdd).not.toHaveBeenCalled()
    expect(preventDefault).not.toHaveBeenCalled()
  })

  it("adds pasted files to the attachment tray", () => {
    const file = new File(["hello"], "hello.txt", { type: "text/plain" })

    render(<LexicalComposer onSubmit={() => undefined} />)

    fireEvent.paste(screen.getByRole("textbox", { name: "Message" }), {
      clipboardData: { files: [file], items: [], types: ["Files"] },
    })

    expect(screen.getByText("hello.txt")).toBeInTheDocument()
  })
})
