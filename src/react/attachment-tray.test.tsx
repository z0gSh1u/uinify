import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { AttachmentTray } from "./attachment-tray"

describe("AttachmentTray", () => {
  it("renders lifecycle details and retry for error attachments", async () => {
    const user = userEvent.setup()
    const file = new File(["hello"], "failed.txt", { type: "text/plain" })
    const onRetry = vi.fn()
    const onRemove = vi.fn()

    render(
      <AttachmentTray
        attachments={[
          {
            id: "error-1",
            error: "Upload failed",
            file,
            mimeType: file.type,
            name: "failed.txt",
            progress: 42,
            size: file.size,
            status: "error",
          },
          {
            file,
            id: "removed-1",
            mimeType: file.type,
            name: "removed.txt",
            size: file.size,
            status: "removed",
          },
        ]}
        onRemove={onRemove}
        onRetry={onRetry}
      />, 
    )

    expect(screen.getByText("failed.txt")).toBeInTheDocument()
    expect(screen.getByText("42")).toBeInTheDocument()
    expect(screen.getByText("Upload failed")).toBeInTheDocument()
    expect(screen.queryByText("removed.txt")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /retry/i }))
    expect(onRetry).toHaveBeenCalledWith(
      expect.objectContaining({ id: "error-1", status: "error" }),
    )

    await user.click(screen.getByRole("button", { name: /remove/i }))
    expect(onRemove).toHaveBeenCalledWith("error-1")
  })
})
