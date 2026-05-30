import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { AttachmentPart } from "../../src/react/attachment-part"
import { AttachmentTray } from "../../src/react/attachment-tray"

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
    expect(screen.getByText("42% uploaded")).toBeInTheDocument()
    expect(screen.getByText("Upload failed")).toBeInTheDocument()
    expect(screen.queryByText("removed.txt")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /retry/i }))
    expect(onRetry).toHaveBeenCalledWith(
      expect.objectContaining({ id: "error-1", status: "error" }),
    )

    await user.click(screen.getByRole("button", { name: /remove/i }))
    expect(onRemove).toHaveBeenCalledWith("error-1")
  })

  it("shows uploading stage labels, blocked reasons, and accurate remove semantics", async () => {
    const user = userEvent.setup()
    const file = new File(["hello"], "draft.txt", { type: "text/plain" })
    const onRemove = vi.fn()

    render(
      <AttachmentTray
        attachments={[
          {
            file,
            id: "upload-1",
            mimeType: file.type,
            name: "draft.txt",
            progress: 55,
            size: file.size,
            status: "uploading",
            error: "Waiting for network slot",
          },
        ]}
        onRemove={onRemove}
      />,
    )

    expect(screen.getByText("Uploading")).toBeInTheDocument()
    expect(screen.getByText("55% uploaded")).toBeInTheDocument()
    expect(screen.getByText("Waiting for network slot")).toBeInTheDocument()

    expect(screen.getByRole("button", { name: /remove attachment/i })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /remove attachment/i }))
    expect(onRemove).toHaveBeenCalledWith("upload-1")
  })

  it("shows rejected attachment feedback and preserves retry/remove semantics", async () => {
    const user = userEvent.setup()
    const file = new File(["blocked"], "blocked.txt", { type: "text/plain" })
    const onRetry = vi.fn()
    const onRemove = vi.fn()

    render(
      <AttachmentTray
        attachments={[
          {
            file,
            id: "rejected-1",
            mimeType: file.type,
            name: "blocked.txt",
            rejection: {
              code: "invalid-type",
              message: "Blocked by host policy",
            },
            size: file.size,
            sourceAttachmentId: "local-1",
            status: "error",
          },
        ]}
        onRemove={onRemove}
        onRetry={onRetry}
      />,
    )

    expect(screen.getByText("Rejected")).toBeInTheDocument()
    expect(screen.getByText("Blocked by host policy")).toBeInTheDocument()
    expect(screen.getByText("This file was rejected before upload.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /retry upload/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /remove attachment/i })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /retry upload/i }))
    expect(onRetry).toHaveBeenCalledWith(
      expect.objectContaining({ id: "rejected-1", status: "error", sourceAttachmentId: "local-1" }),
    )

    await user.click(screen.getByRole("button", { name: /remove attachment/i }))
    expect(onRemove).toHaveBeenCalledWith("rejected-1")
  })
})

describe("AttachmentPart", () => {
  it("shows continuity state without exposing raw source attachment ids", () => {
    render(
      <AttachmentPart
        part={{
          id: "attachment-part-1",
          kind: "attachment",
          attachment: {
            id: "attachment-1",
            name: "report.pdf",
            status: "uploaded",
            remoteUrl: "https://example.com/report.pdf",
            sourceAttachmentId: "local-upload-123",
          },
        }}
      />,
    )

    expect(screen.getByText("Uploaded")).toBeInTheDocument()
    expect(screen.getByText("Linked to an earlier attachment")).toBeInTheDocument()
    expect(screen.queryByText(/local-upload-123/i)).not.toBeInTheDocument()
  })

  it("shows rejected transcript attachments with direct validation feedback", () => {
    render(
      <AttachmentPart
        part={{
          id: "attachment-part-2",
          kind: "attachment",
          attachment: {
            id: "attachment-2",
            name: "blocked.pdf",
            rejection: {
              code: "invalid-type",
              message: "Blocked by host policy",
            },
            status: "error",
            sourceAttachmentId: "local-upload-456",
          },
        }}
      />,
    )

    expect(screen.getByText("Rejected")).toBeInTheDocument()
    expect(screen.getByText("Blocked by host policy")).toBeInTheDocument()
    expect(screen.getByText("Linked to an earlier attachment")).toBeInTheDocument()
    expect(screen.queryByText(/local-upload-456/i)).not.toBeInTheDocument()
  })
})
