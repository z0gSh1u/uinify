import { describe, expect, it } from "vitest"
import type { UiRuntimeState } from "../model/types"
import { applyStreamEvent } from "./apply-stream-event"

const emptyState: UiRuntimeState = {
  conversationId: "demo",
  messages: [],
  status: "idle",
  error: null,
  warnings: [],
}

describe("applyStreamEvent", () => {
  it("merges text, reasoning, tool calls, and artifacts into one message", () => {
    const withMessage = applyStreamEvent(emptyState, {
      type: "message.started",
      messageId: "m1",
      role: "assistant",
    })
    const withText = applyStreamEvent(withMessage, {
      type: "part.text.delta",
      messageId: "m1",
      partId: "p1",
      delta: "Hello",
    })
    const withReasoning = applyStreamEvent(withText, {
      type: "part.reasoning.delta",
      messageId: "m1",
      partId: "p2",
      delta: "Thinking...",
    })
    const withTool = applyStreamEvent(withReasoning, {
      type: "part.tool.updated",
      messageId: "m1",
      partId: "p3",
      toolName: "web_search",
      status: "running",
      inputSummary: "query=uinify",
    })
    const complete = applyStreamEvent(withTool, {
      type: "part.artifact.emitted",
      messageId: "m1",
      partId: "p4",
      artifact: {
        id: "a1",
        kind: "code",
        title: "Runtime snippet",
        metadata: {
          language: "ts",
          lines: 1,
          runnable: true,
        },
        defaultViewId: "source",
        views: [
          {
            id: "source",
            label: "Source",
            kind: "source",
            language: "ts",
            value: "console.log('uinify')",
          },
          {
            id: "preview",
            label: "Preview",
            kind: "structured",
            value: { summary: "Logs the demo label" },
          },
        ],
      },
    })

    expect(complete.messages[0]?.parts).toEqual([
      { id: "p1", kind: "text", text: "Hello" },
      { id: "p2", kind: "reasoning", text: "Thinking...", state: "streaming" },
      {
        id: "p3",
        kind: "tool-call",
        toolName: "web_search",
        status: "running",
        inputSummary: "query=uinify",
        outputSummary: null,
      },
      {
        id: "p4",
        kind: "artifact",
        artifact: {
          id: "a1",
          kind: "code",
          title: "Runtime snippet",
          metadata: {
            language: "ts",
            lines: 1,
            runnable: true,
          },
          defaultViewId: "source",
          views: [
            {
              id: "source",
              label: "Source",
              kind: "source",
              language: "ts",
              value: "console.log('uinify')",
            },
            {
              id: "preview",
              label: "Preview",
              kind: "structured",
              value: { summary: "Logs the demo label" },
            },
          ],
        },
      },
    ])
  })

  it("records a warning instead of crashing on out-of-order delta", () => {
    const next = applyStreamEvent(emptyState, {
      type: "part.text.delta",
      messageId: "missing",
      partId: "p1",
      delta: "late",
    })

    expect(next.warnings).toEqual(["Missing message missing for event"])
    expect(next.messages).toEqual([])
  })

  it("preserves existing tool summaries when an update omits them", () => {
    const withMessage = applyStreamEvent(emptyState, {
      type: "message.started",
      messageId: "m1",
      role: "assistant",
    })
    const withTool = applyStreamEvent(withMessage, {
      type: "part.tool.updated",
      messageId: "m1",
      partId: "tool-1",
      toolName: "web_search",
      status: "running",
      inputSummary: "query=uinify",
      outputSummary: "1 result",
    })
    const updated = applyStreamEvent(withTool, {
      type: "part.tool.updated",
      messageId: "m1",
      partId: "tool-1",
      toolName: "web_search",
      status: "complete",
    })

    expect(updated.messages[0]?.parts).toContainEqual({
      id: "tool-1",
      kind: "tool-call",
      toolName: "web_search",
      status: "complete",
      inputSummary: "query=uinify",
      outputSummary: "1 result",
    })
  })

  it("preserves stable attachment metadata across upload updates", () => {
    const withMessage = applyStreamEvent(emptyState, {
      type: "message.started",
      messageId: "m1",
      role: "assistant",
    })
    const uploading = applyStreamEvent(withMessage, {
      type: "part.attachment.updated",
      messageId: "m1",
      partId: "attachment-1",
      attachment: {
        id: "file-1",
        name: "report.pdf",
        mimeType: "application/pdf",
        size: 1024,
        status: "uploading",
        progress: 0.4,
      },
    })
    const uploaded = applyStreamEvent(uploading, {
      type: "part.attachment.updated",
      messageId: "m1",
      partId: "attachment-1",
      attachment: {
        id: "file-1",
        name: "report.pdf",
        status: "uploaded",
        remoteUrl: "https://example.com/report.pdf",
      },
    })

    expect(uploaded.messages[0]?.parts).toContainEqual({
      id: "attachment-1",
      kind: "attachment",
      attachment: {
        id: "file-1",
        name: "report.pdf",
        mimeType: "application/pdf",
        size: 1024,
        status: "uploaded",
        remoteUrl: "https://example.com/report.pdf",
      },
    })
  })

  it("preserves sourceAttachmentId when a later upload update omits it", () => {
    const withMessage = applyStreamEvent(emptyState, {
      type: "message.started",
      messageId: "m1",
      role: "assistant",
    })
    const queued = applyStreamEvent(withMessage, {
      type: "part.attachment.updated",
      messageId: "m1",
      partId: "attachment-1",
      attachment: {
        id: "file-1",
        name: "report.pdf",
        status: "queued",
        sourceAttachmentId: "local-file-1",
      },
    })
    const uploaded = applyStreamEvent(queued, {
      type: "part.attachment.updated",
      messageId: "m1",
      partId: "attachment-1",
      attachment: {
        id: "file-1",
        name: "report.pdf",
        status: "uploaded",
        remoteUrl: "https://example.com/report.pdf",
      },
    })

    const attachmentPart = uploaded.messages[0]?.parts.find(
      (part) => part.id === "attachment-1" && part.kind === "attachment",
    )

    expect(attachmentPart).toMatchObject({
      id: "attachment-1",
      kind: "attachment",
      attachment: {
        id: "file-1",
        name: "report.pdf",
        status: "uploaded",
        sourceAttachmentId: "local-file-1",
        remoteUrl: "https://example.com/report.pdf",
      },
    })
  })

  it("clears stale attachment rejection when a later update succeeds", () => {
    const withMessage = applyStreamEvent(emptyState, {
      type: "message.started",
      messageId: "m1",
      role: "assistant",
    })
    const rejected = applyStreamEvent(withMessage, {
      type: "part.attachment.updated",
      messageId: "m1",
      partId: "attachment-1",
      attachment: {
        id: "file-1",
        name: "report.pdf",
        status: "error",
        sourceAttachmentId: "local-file-1",
        rejection: {
          code: "invalid-type",
          message: "Unsupported file type",
        },
      },
    })
    const uploaded = applyStreamEvent(rejected, {
      type: "part.attachment.updated",
      messageId: "m1",
      partId: "attachment-1",
      attachment: {
        id: "file-1",
        name: "report.pdf",
        status: "uploaded",
        remoteUrl: "https://example.com/report.pdf",
      },
    })

    const attachmentPart = uploaded.messages[0]?.parts.find(
      (part) => part.id === "attachment-1" && part.kind === "attachment",
    )

    expect(attachmentPart).toMatchObject({
      id: "attachment-1",
      kind: "attachment",
      attachment: {
        id: "file-1",
        name: "report.pdf",
        status: "uploaded",
        sourceAttachmentId: "local-file-1",
        remoteUrl: "https://example.com/report.pdf",
      },
    })
    expect(attachmentPart?.kind === "attachment" ? attachmentPart.attachment.rejection : undefined).toBe(
      undefined,
    )
  })

  it("clears stale attachment error when a failed upload retries", () => {
    const withMessage = applyStreamEvent(emptyState, {
      type: "message.started",
      messageId: "m1",
      role: "assistant",
    })
    const failed = applyStreamEvent(withMessage, {
      type: "part.attachment.updated",
      messageId: "m1",
      partId: "attachment-1",
      attachment: {
        id: "file-1",
        name: "report.pdf",
        status: "error",
        error: "network timeout",
      },
    })
    const retried = applyStreamEvent(failed, {
      type: "part.attachment.updated",
      messageId: "m1",
      partId: "attachment-1",
      attachment: {
        id: "file-1",
        name: "report.pdf",
        status: "uploading",
        progress: 0.2,
      },
    })

    expect(retried.messages[0]?.parts).toContainEqual({
      id: "attachment-1",
      kind: "attachment",
      attachment: {
        id: "file-1",
        name: "report.pdf",
        status: "uploading",
        progress: 0.2,
      },
    })
  })

  it("drops stale transient fields when an attachment reaches a terminal state", () => {
    const withMessage = applyStreamEvent(emptyState, {
      type: "message.started",
      messageId: "m1",
      role: "assistant",
    })
    const errored = applyStreamEvent(withMessage, {
      type: "part.attachment.updated",
      messageId: "m1",
      partId: "attachment-1",
      attachment: {
        id: "file-1",
        name: "report.pdf",
        mimeType: "application/pdf",
        size: 1024,
        status: "error",
        progress: 0.9,
        error: "network timeout",
      },
    })
    const removed = applyStreamEvent(errored, {
      type: "part.attachment.updated",
      messageId: "m1",
      partId: "attachment-1",
      attachment: {
        id: "file-1",
        name: "report.pdf",
        status: "removed",
      },
    })

    expect(removed.messages[0]?.parts).toContainEqual({
      id: "attachment-1",
      kind: "attachment",
      attachment: {
        id: "file-1",
        name: "report.pdf",
        status: "removed",
      },
    })
  })

  it("returns to error after active work finishes if a failure is still present", () => {
    const withFirst = applyStreamEvent(emptyState, {
      type: "message.started",
      messageId: "m1",
      role: "assistant",
    })
    const withSecond = applyStreamEvent(withFirst, {
      type: "message.started",
      messageId: "m2",
      role: "assistant",
    })
    const failedFirst = applyStreamEvent(withSecond, {
      type: "message.failed",
      messageId: "m1",
      error: "boom",
    })
    const completedSecond = applyStreamEvent(failedFirst, {
      type: "message.completed",
      messageId: "m2",
    })

    expect(failedFirst.status).toBe("streaming")
    expect(completedSecond.status).toBe("error")
  })

  it("sets runtime status to error when a message fails and no work is still streaming", () => {
    const withMessage = applyStreamEvent(emptyState, {
      type: "message.started",
      messageId: "m1",
      role: "assistant",
    })

    const failed = applyStreamEvent(withMessage, {
      type: "message.failed",
      messageId: "m1",
      error: "boom",
    })

    expect(failed.messages[0]?.state).toBe("error")
    expect(failed.error).toBe("boom")
    expect(failed.status).toBe("error")
  })
})
