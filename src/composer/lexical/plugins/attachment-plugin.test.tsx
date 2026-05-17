import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { collectAttachments, createAttachmentHandlers } from "./attachment-plugin"
import { LexicalComposer } from "../lexical-composer"

describe("attachment-plugin", () => {
  it("collectAttachments creates ready attachments from files", () => {
    const file = new File(["hello"], "hello.txt", { type: "text/plain" })

    expect(collectAttachments([file])).toEqual([
      {
        id: "hello.txt-0",
        file,
        status: "ready",
      },
    ])
  })

  it("createAttachmentHandlers forwards pasted and dropped files", () => {
    const onAdd = vi.fn()
    const file = new File(["hello"], "hello.txt", { type: "text/plain" })
    const handlers = createAttachmentHandlers(onAdd)
    const preventDefault = vi.fn()

    handlers.onPaste({ clipboardData: { files: [file] } } as never)
    handlers.onDrop({ dataTransfer: { files: [file] }, preventDefault } as never)

    expect(onAdd).toHaveBeenNthCalledWith(1, [
      {
        id: "hello.txt-0",
        file,
        status: "ready",
      },
    ])
    expect(onAdd).toHaveBeenNthCalledWith(2, [
      {
        id: "hello.txt-0",
        file,
        status: "ready",
      },
    ])
    expect(preventDefault).toHaveBeenCalled()
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
