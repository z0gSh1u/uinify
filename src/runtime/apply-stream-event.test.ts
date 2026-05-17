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
        language: "ts",
        content: "console.log('uinify')",
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
          language: "ts",
          content: "console.log('uinify')",
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

  it("returns to idle after a failed message no longer blocks active work", () => {
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
    expect(completedSecond.status).toBe("idle")
  })
})
