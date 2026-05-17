import { createChatRuntime, type UiStreamEvent } from "../../src"
import { describe, expect, it } from "vitest"
import { mapAgentLikeEvent, type AgentLikeEvent } from "./agent-like"
import { mapCustomMinimalEvent } from "./custom-minimal"
import { agentLikeFixture, customMinimalFixture, openAiLikeFixture } from "./protocol-fixtures"
import { mapOpenAiLikeChunk } from "./openai-like"

describe("OpenAI-like reference mapper", () => {
  it("maps a streaming protocol fixture into canonical UiStreamEvent values", () => {
    const mappedEvents = openAiLikeFixture.flatMap(mapOpenAiLikeChunk)

    expect(mappedEvents).toEqual<UiStreamEvent[]>([
      {
        type: "message.started",
        messageId: "msg_openai_like_1",
        role: "assistant",
      },
      {
        type: "part.text.delta",
        messageId: "msg_openai_like_1",
        partId: "text_openai_like_1",
        delta: "Hello ",
      },
      {
        type: "part.text.delta",
        messageId: "msg_openai_like_1",
        partId: "text_openai_like_1",
        delta: "world!",
      },
      {
        type: "part.tool.updated",
        messageId: "msg_openai_like_1",
        partId: "tool_openai_like_1",
        toolName: "searchDocs",
        status: "complete",
        inputSummary: "query: reference mappers",
        outputSummary: "3 results returned",
      },
      {
        type: "part.artifact.emitted",
        messageId: "msg_openai_like_1",
        partId: "artifact_openai_like_1",
        artifact: {
          id: "artifact_openai_like_1",
          kind: "code",
          title: "Reference mapper example",
          metadata: {
            runnable: true,
            sourceProtocol: "openai-like",
          },
          defaultViewId: "source",
          views: [
            {
              id: "source",
              label: "TypeScript",
              kind: "source",
              language: "ts",
              value: "export const mapped = true\n",
            },
            {
              id: "preview",
              label: "Preview",
              kind: "preview",
              value: "mapped = true",
            },
          ],
        },
      },
      {
        type: "message.completed",
        messageId: "msg_openai_like_1",
      },
    ])
  })

  it("dispatches mapped events into the runtime and produces the expected message parts", () => {
    const runtime = createChatRuntime({ conversationId: "reference-mapper-example" })

    for (const event of openAiLikeFixture.flatMap(mapOpenAiLikeChunk)) {
      runtime.dispatch(event)
    }

    expect(runtime.getState().messages).toEqual([
      {
        id: "msg_openai_like_1",
        role: "assistant",
        state: "complete",
        feedback: "none",
        parts: [
          {
            id: "text_openai_like_1",
            kind: "text",
            text: "Hello world!",
          },
          {
            id: "tool_openai_like_1",
            kind: "tool-call",
            toolName: "searchDocs",
            status: "complete",
            inputSummary: "query: reference mappers",
            outputSummary: "3 results returned",
          },
          {
            id: "artifact_openai_like_1",
            kind: "artifact",
            artifact: {
              id: "artifact_openai_like_1",
              kind: "code",
              title: "Reference mapper example",
              metadata: {
                runnable: true,
                sourceProtocol: "openai-like",
              },
              defaultViewId: "source",
              views: [
                {
                  id: "source",
                  label: "TypeScript",
                  kind: "source",
                  language: "ts",
                  value: "export const mapped = true\n",
                },
                {
                  id: "preview",
                  label: "Preview",
                  kind: "preview",
                  value: "mapped = true",
                },
              ],
            },
          },
        ],
      },
    ])
  })
})

describe("Agent-like reference mapper", () => {
  it("maps tool lifecycle updates for started and failed branches", () => {
    expect(
      ([
        {
          type: "agent.tool.started",
          runId: "run_agent_like_tool_status",
          messageId: "agent_msg_tool_status",
          tool: {
            id: "agent_tool_status",
            name: "searchDocs",
            input: {
              query: "tool lifecycle",
            },
          },
        },
        {
          type: "agent.tool.failed",
          runId: "run_agent_like_tool_status",
          messageId: "agent_msg_tool_status",
          tool: {
            id: "agent_tool_status",
            name: "searchDocs",
            input: {
              query: "tool lifecycle",
            },
            error: "Search backend unavailable",
          },
        },
      ] satisfies AgentLikeEvent[]).flatMap(mapAgentLikeEvent),
    ).toEqual<UiStreamEvent[]>([
      {
        type: "part.tool.updated",
        messageId: "agent_msg_tool_status",
        partId: "agent_tool_status",
        toolName: "searchDocs",
        status: "running",
        inputSummary: "query: tool lifecycle",
      },
      {
        type: "part.tool.updated",
        messageId: "agent_msg_tool_status",
        partId: "agent_tool_status",
        toolName: "searchDocs",
        status: "error",
        inputSummary: "query: tool lifecycle",
        outputSummary: "Search backend unavailable",
      },
    ])
  })

  it("dispatches mapped workflow events into the runtime and preserves the final assistant state", () => {
    const runtime = createChatRuntime({ conversationId: "reference-mapper-agent-example" })

    for (const event of agentLikeFixture.flatMap(mapAgentLikeEvent)) {
      runtime.dispatch(event)
    }

    expect(runtime.getState().messages).toEqual([
      {
        id: "agent_msg_1",
        role: "assistant",
        state: "complete",
        feedback: "none",
        parts: [
          {
            id: "agent_text_1",
            kind: "text",
            text: "I'll inspect the docs and package a minimal adapter example.",
          },
          {
            id: "agent_tool_1",
            kind: "tool-call",
            toolName: "searchDocs",
            status: "complete",
            inputSummary: "query: reference mapper adapter example",
            outputSummary: "Found runtime API and example fixture references",
          },
          {
            id: "agent_artifact_1",
            kind: "artifact",
            artifact: {
              id: "agent_artifact_1",
              kind: "report",
              title: "Adapter handoff payload",
              metadata: {
                sourceProtocol: "agent-like",
                adapter: "host-event",
              },
              defaultViewId: "json",
              views: [
                {
                  id: "json",
                  label: "JSON",
                  kind: "structured",
                  language: "json",
                  value: {
                    adapter: "host-event",
                    dispatched: true,
                  },
                },
                {
                  id: "summary",
                  label: "Summary",
                  kind: "preview",
                  value: "Adapter payload ready",
                },
              ],
            },
          },
        ],
      },
    ])
  })
})

describe("Custom minimal reference mapper", () => {
  it("uses the explicit part id carried by the protocol", () => {
    expect(
      mapCustomMinimalEvent({
        kind: "text",
        id: "custom_min_msg_explicit",
        partId: "custom_min_part_explicit",
        text: "Explicit ids are clearer than rewriting message ids.",
      } as never),
    ).toEqual<UiStreamEvent[]>([
      {
        type: "part.text.delta",
        messageId: "custom_min_msg_explicit",
        partId: "custom_min_part_explicit",
        delta: "Explicit ids are clearer than rewriting message ids.",
      },
    ])
  })

  it("maps a tiny generic protocol into canonical UiStreamEvent values using explicit part ids", () => {
    expect(customMinimalFixture.flatMap(mapCustomMinimalEvent)).toEqual<UiStreamEvent[]>([
      {
        type: "message.started",
        messageId: "custom_min_msg_1",
        role: "assistant",
      },
      {
        type: "part.text.delta",
        messageId: "custom_min_msg_1",
        partId: "custom_min_text_1",
        delta: "Mapped from a tiny host protocol.",
      },
      {
        type: "message.completed",
        messageId: "custom_min_msg_1",
      },
    ])
  })
})
