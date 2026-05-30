import { describe, expect, it } from "vitest"
import type { UiRuntimeState } from "../../src/model/types"
import { applyStreamEvent } from "../../src/runtime/apply-stream-event"

const emptyState: UiRuntimeState = {
  conversationId: "demo",
  messages: [],
  status: "idle",
  error: null,
  warnings: [],
}

describe("applyStreamEvent", () => {
  it("merges text, reasoning, steps, and artifacts into one message", () => {
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
    const withStep = applyStreamEvent(withReasoning, {
      type: "part.step.started",
      messageId: "m1",
      partId: "p3",
      category: "tool",
      label: "web_search",
      inputSummary: "query=uinify",
    })
    const completedStep = applyStreamEvent(withStep, {
      type: "part.step.completed",
      messageId: "m1",
      partId: "p3",
      outputSummary: "1 result",
    })
    const complete = applyStreamEvent(completedStep, {
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
        kind: "step",
        category: "tool",
        status: "complete",
        label: "web_search",
        inputSummary: "query=uinify",
        outputSummary: "1 result",
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

  it("applies step events as the unified agent execution part", () => {
    let state = emptyState

    state = applyStreamEvent(state, { type: "message.started", messageId: "m1", role: "assistant" })
    state = applyStreamEvent(state, {
      type: "part.step.started",
      messageId: "m1",
      partId: "s1",
      category: "tool",
      label: "Search docs",
      inputSummary: "query: SSE support",
    })
    state = applyStreamEvent(state, {
      type: "part.step.completed",
      messageId: "m1",
      partId: "s1",
      outputSummary: "Found the SSE guide.",
    })

    expect(state.messages[0]?.parts).toEqual([
      {
        id: "s1",
        kind: "step",
        category: "tool",
        status: "complete",
        label: "Search docs",
        inputSummary: "query: SSE support",
        outputSummary: "Found the SSE guide.",
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

  it("merges step updates without dropping existing fields", () => {
    let state = emptyState

    state = applyStreamEvent(state, { type: "message.started", messageId: "m1", role: "assistant" })
    state = applyStreamEvent(state, {
      type: "part.step.started",
      messageId: "m1",
      partId: "step-1",
      category: "retrieval",
      label: "Search docs",
      inputSummary: "query=uinify",
    })
    state = applyStreamEvent(state, {
      type: "part.step.updated",
      messageId: "m1",
      partId: "step-1",
      summary: "Checking docs index",
    })
    state = applyStreamEvent(state, {
      type: "part.step.failed",
      messageId: "m1",
      partId: "step-1",
      error: "Search backend unavailable",
    })

    expect(state.messages[0]?.parts).toContainEqual({
      id: "step-1",
      kind: "step",
      category: "retrieval",
      status: "error",
      label: "Search docs",
      inputSummary: "query=uinify",
      summary: "Checking docs index",
      error: "Search backend unavailable",
    })
  })

  it("clears stale terminal fields when a failed step starts again", () => {
    let state = emptyState

    state = applyStreamEvent(state, { type: "message.started", messageId: "m1", role: "assistant" })
    state = applyStreamEvent(state, {
      type: "part.step.started",
      messageId: "m1",
      partId: "step-1",
      category: "tool",
      label: "Search docs",
    })
    state = applyStreamEvent(state, {
      type: "part.step.failed",
      messageId: "m1",
      partId: "step-1",
      error: "Search failed",
      outputSummary: "No results",
      completedAt: "2026-05-30T01:00:00.000Z",
    })
    state = applyStreamEvent(state, {
      type: "part.step.started",
      messageId: "m1",
      partId: "step-1",
      category: "tool",
      label: "Search docs",
      inputSummary: "retry query",
      startedAt: "2026-05-30T01:01:00.000Z",
    })

    expect(state.messages[0]?.parts).toContainEqual({
      id: "step-1",
      kind: "step",
      category: "tool",
      status: "running",
      label: "Search docs",
      inputSummary: "retry query",
      startedAt: "2026-05-30T01:01:00.000Z",
    })
  })

  it("clears stale error when a failed step later completes", () => {
    let state = emptyState

    state = applyStreamEvent(state, { type: "message.started", messageId: "m1", role: "assistant" })
    state = applyStreamEvent(state, {
      type: "part.step.started",
      messageId: "m1",
      partId: "step-1",
      category: "retrieval",
      label: "Search docs",
    })
    state = applyStreamEvent(state, {
      type: "part.step.failed",
      messageId: "m1",
      partId: "step-1",
      error: "Search failed",
    })
    state = applyStreamEvent(state, {
      type: "part.step.completed",
      messageId: "m1",
      partId: "step-1",
      outputSummary: "Found docs",
      completedAt: "2026-05-30T01:02:00.000Z",
    })

    expect(state.messages[0]?.parts).toContainEqual({
      id: "step-1",
      kind: "step",
      category: "retrieval",
      status: "complete",
      label: "Search docs",
      outputSummary: "Found docs",
      completedAt: "2026-05-30T01:02:00.000Z",
    })
  })

  it("applies image emitted events", () => {
    let state = emptyState

    state = applyStreamEvent(state, { type: "message.started", messageId: "m1", role: "user" })
    state = applyStreamEvent(state, {
      type: "part.image.emitted",
      messageId: "m1",
      partId: "img1",
      image: {
        url: "blob:http://localhost/image",
        alt: "Uploaded diagram",
        mimeType: "image/png",
        sourceAttachmentId: "attachment-1",
      },
    })

    expect(state.messages[0]?.parts).toEqual([
      {
        id: "img1",
        kind: "image",
        url: "blob:http://localhost/image",
        alt: "Uploaded diagram",
        mimeType: "image/png",
        sourceAttachmentId: "attachment-1",
      },
    ])
  })

  it("upserts image emitted events by part id", () => {
    let state = emptyState

    state = applyStreamEvent(state, { type: "message.started", messageId: "m1", role: "user" })
    state = applyStreamEvent(state, {
      type: "part.image.emitted",
      messageId: "m1",
      partId: "img1",
      image: {
        url: "blob:http://localhost/image",
        alt: "Original diagram",
      },
    })
    state = applyStreamEvent(state, {
      type: "part.image.emitted",
      messageId: "m1",
      partId: "img1",
      image: {
        url: "https://cdn.example.com/image.png",
        alt: "Uploaded diagram",
        mimeType: "image/png",
        width: 640,
        height: 480,
        sourceAttachmentId: "attachment-1",
      },
    })

    expect(state.messages[0]?.parts).toEqual([
      {
        id: "img1",
        kind: "image",
        url: "https://cdn.example.com/image.png",
        alt: "Uploaded diagram",
        mimeType: "image/png",
        width: 640,
        height: 480,
        sourceAttachmentId: "attachment-1",
      },
    ])
  })

  it("uses partId and the event type as image part identity", () => {
    let state = emptyState

    state = applyStreamEvent(state, { type: "message.started", messageId: "m1", role: "user" })
    state = applyStreamEvent(state, {
      type: "part.image.emitted",
      messageId: "m1",
      partId: "img-from-event",
      image: {
        url: "https://example.com/image.png",
        alt: "Event-owned identity",
      },
    })

    expect(state.messages[0]?.parts[0]).toMatchObject({
      id: "img-from-event",
      kind: "image",
      url: "https://example.com/image.png",
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
