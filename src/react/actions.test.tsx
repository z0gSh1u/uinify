import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, expectTypeOf, it, vi } from "vitest"
import type { UiArtifactPart, UiMessage } from "../model/types"
import { createChatRuntime } from "../runtime/create-chat-runtime"
import {
  getArtifactViewPayload,
  getAvailableMessageActions,
  getAvailablePartActions,
  type UiMessageActionDescriptor,
  type UiMessageActionId,
  type UiPartActionDescriptor,
  type UiPartActionId,
} from "./actions"
import { ArtifactContainer } from "./artifact-container"
import { ChatRoot } from "./chat-root"
import { CurrentMessageProvider } from "./current-message"

describe("actions", () => {
  it("exposes stable action id and descriptor types", () => {
    expectTypeOf<UiMessageActionId>().toEqualTypeOf<"copy" | "retry" | "regenerate">()
    expectTypeOf<UiPartActionId>().toEqualTypeOf<
      "copy" | "toggle-reasoning" | "toggle-tool-details" | "open-artifact-view"
    >()

    expectTypeOf<UiMessageActionDescriptor>().toEqualTypeOf<{
      id: UiMessageActionId
      label: string
    }>()
    expectTypeOf<UiPartActionDescriptor>().toEqualTypeOf<{
      id: UiPartActionId
      label: string
    }>()
  })

  it("returns message actions only for completed assistant messages", () => {
    const message: UiMessage = {
      id: "message-1",
      role: "assistant",
      state: "complete",
      feedback: "none",
      parts: [],
    }

    expect(getAvailableMessageActions(message).map((action) => action.id)).toEqual([
      "copy",
      "retry",
      "regenerate",
    ])
    expect(
      getAvailableMessageActions({
        ...message,
        role: "user",
      }),
    ).toEqual([])
    expect(
      getAvailableMessageActions({
        ...message,
        state: "streaming",
      }),
    ).toEqual([])
  })

  it("returns part actions by part kind and artifact view count", () => {
    const reasoningActions = getAvailablePartActions({
      id: "reasoning-1",
      kind: "reasoning",
      text: "Chain of thought",
      state: "complete",
    })

    expect(reasoningActions.map((action) => action.id)).toEqual([
      "toggle-reasoning",
      "copy",
    ])
    expect(reasoningActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "toggle-reasoning", label: "Reasoning" }),
      ]),
    )

    const toolCallActions = getAvailablePartActions({
      id: "tool-1",
      kind: "tool-call",
      toolName: "searchDocs",
      status: "complete",
      inputSummary: "query",
      outputSummary: "result",
    })

    expect(toolCallActions.map((action) => action.id)).toEqual([
      "toggle-tool-details",
      "copy",
    ])
    expect(toolCallActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "toggle-tool-details", label: "Tool details" }),
      ]),
    )

    expect(
      getAvailablePartActions({
        id: "artifact-1",
        kind: "artifact",
        artifact: {
          id: "artifact-data-1",
          kind: "json",
          views: [
            {
              id: "source",
              label: "Source",
              kind: "source",
              value: "{}",
            },
            {
              id: "preview",
              label: "Preview",
              kind: "preview",
              value: "Rendered",
            },
          ],
        },
      }).map((action) => action.id),
    ).toEqual(["open-artifact-view"])

    expect(
      getAvailablePartActions({
        id: "artifact-2",
        kind: "artifact",
        artifact: {
          id: "artifact-data-2",
          kind: "json",
          views: [
            {
              id: "preview",
              label: "Preview",
              kind: "preview",
              value: "Rendered",
            },
          ],
        },
      }),
    ).toEqual([])

    expect(
      getAvailablePartActions({
        id: "text-1",
        kind: "text",
        text: "Hello",
      }).map((action) => action.id),
    ).toEqual(["copy"])

    expect(
      getAvailablePartActions({
        id: "image-1",
        kind: "image",
        url: "https://example.com/image.png",
      }),
    ).toEqual([])
  })

  it("returns the artifact view payload for open-artifact-view", () => {
    const part: UiArtifactPart = {
      id: "part-1",
      kind: "artifact",
      artifact: {
        id: "artifact-1",
        kind: "diagram",
        views: [
          {
            id: "preview",
            label: "Preview",
            kind: "preview",
            value: "diagram",
          },
        ],
      },
    }

    expect(getArtifactViewPayload(part, "preview")).toMatchObject({
      action: "open-artifact-view",
      partId: "part-1",
      artifactId: "artifact-1",
      artifactKind: "diagram",
      viewId: "preview",
    })

    expect(getArtifactViewPayload(part, "preview")).not.toBe(getArtifactViewPayload(part, "preview"))
  })

  it("emits open-artifact-view when the artifact surface switches views", async () => {
    const user = userEvent.setup()
    const onPartAction = vi.fn()
    const runtime = createChatRuntime({ conversationId: "demo" })
    const message: UiMessage = {
      id: "message-1",
      role: "assistant",
      state: "complete",
      feedback: "none",
      parts: [],
    }
    const part: UiArtifactPart = {
      id: "part-1",
      kind: "artifact",
      artifact: {
        id: "artifact-1",
        kind: "diagram",
        defaultViewId: "preview",
        views: [
          {
            id: "preview",
            label: "Preview",
            kind: "preview",
            value: "diagram",
          },
          {
            id: "source",
            label: "Source",
            kind: "source",
            value: "raw diagram",
          },
        ],
      },
    }

    render(
      <ChatRoot onPartAction={onPartAction} runtime={runtime}>
        <CurrentMessageProvider message={message}>
          <ArtifactContainer part={part} />
        </CurrentMessageProvider>
      </ChatRoot>,
    )

    await user.click(screen.getByRole("button", { name: "Source" }))

    expect(screen.getByRole("button", { name: "Source" })).toHaveAttribute("aria-pressed", "true")
    expect(onPartAction).toHaveBeenCalledWith({
      action: "open-artifact-view",
      messageId: "message-1",
      partId: "part-1",
      partKind: "artifact",
      artifactId: "artifact-1",
      artifactKind: "diagram",
      viewId: "source",
    })
    expect(onPartAction).toHaveBeenCalledTimes(1)
  })

  it("does not emit open-artifact-view when the artifact surface re-clicks the active view", async () => {
    const user = userEvent.setup()
    const onPartAction = vi.fn()
    const runtime = createChatRuntime({ conversationId: "demo" })
    const message: UiMessage = {
      id: "message-1",
      role: "assistant",
      state: "complete",
      feedback: "none",
      parts: [],
    }
    const part: UiArtifactPart = {
      id: "part-1",
      kind: "artifact",
      artifact: {
        id: "artifact-1",
        kind: "diagram",
        defaultViewId: "preview",
        views: [
          {
            id: "preview",
            label: "Preview",
            kind: "preview",
            value: "diagram",
          },
          {
            id: "source",
            label: "Source",
            kind: "source",
            value: "raw diagram",
          },
        ],
      },
    }

    render(
      <ChatRoot onPartAction={onPartAction} runtime={runtime}>
        <CurrentMessageProvider message={message}>
          <ArtifactContainer part={part} />
        </CurrentMessageProvider>
      </ChatRoot>,
    )

    await user.click(screen.getByRole("button", { name: "Preview" }))

    expect(screen.getByRole("button", { name: "Preview" })).toHaveAttribute("aria-pressed", "true")
    expect(onPartAction).not.toHaveBeenCalled()
  })

  it("returns fresh arrays and descriptors from helper APIs", () => {
    const message: UiMessage = {
      id: "message-1",
      role: "assistant",
      state: "complete",
      feedback: "none",
      parts: [],
    }

    const firstMessageActions = getAvailableMessageActions(message)
    const secondMessageActions = getAvailableMessageActions(message)

    expect(firstMessageActions).not.toBe(secondMessageActions)
    expect(firstMessageActions[0]).not.toBe(secondMessageActions[0])

    const firstReasoningActions = getAvailablePartActions({
      id: "reasoning-1",
      kind: "reasoning",
      text: "Chain of thought",
      state: "complete",
    })
    const secondReasoningActions = getAvailablePartActions({
      id: "reasoning-1",
      kind: "reasoning",
      text: "Chain of thought",
      state: "complete",
    })

    expect(firstReasoningActions).not.toBe(secondReasoningActions)
    expect(firstReasoningActions[0]).not.toBe(secondReasoningActions[0])
  })
})
