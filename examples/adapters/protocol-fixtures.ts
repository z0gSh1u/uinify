import type { AgentLikeEvent } from "./agent-like"
import type { CustomMinimalEvent } from "./custom-minimal"
import type { OpenAiLikeChunk } from "./openai-like"

export const openAiLikeFixture: OpenAiLikeChunk[] = [
  {
    type: "response.started",
    response: {
      response_id: "msg_openai_like_1",
      speaker: "assistant",
    },
  },
  {
    type: "response.output_text.delta",
    response_id: "msg_openai_like_1",
    item: {
      item_id: "text_openai_like_1",
      index: 0,
    },
    delta: "Hello ",
  },
  {
    type: "response.output_text.delta",
    response_id: "msg_openai_like_1",
    item: {
      item_id: "text_openai_like_1",
      index: 1,
    },
    delta: "world!",
  },
  {
    type: "response.tool.updated",
    response_id: "msg_openai_like_1",
    tool_call: {
      call_id: "tool_openai_like_1",
      name: "searchDocs",
      phase: "finished",
      arguments_text: '{"query":"reference mappers"}',
      result: {
        summary: "3 results returned",
      },
    },
  },
  {
    type: "response.artifact",
    response_id: "msg_openai_like_1",
    asset: {
      artifact_id: "artifact_openai_like_1",
      artifact_type: "code",
      name: "Reference mapper example",
      attributes: {
        runnable: true,
        sourceProtocol: "openai-like",
      },
      primary_view: "source",
      contents: [
        {
          view_id: "source",
          title: "TypeScript",
          mime_type: "text/x-typescript",
          body: "export const mapped = true\n",
        },
        {
          view_id: "preview",
          title: "Preview",
          mime_type: "application/vnd.uinify.preview",
          body: "mapped = true",
        },
      ],
    },
  },
  {
    type: "response.completed",
    response: {
      response_id: "msg_openai_like_1",
    },
  },
]

export const agentLikeFixture: AgentLikeEvent[] = [
  {
    type: "agent.message.started",
    runId: "run_agent_like_1",
    message: {
      id: "agent_msg_1",
      role: "assistant",
    },
  },
  {
    type: "agent.message.delta",
    runId: "run_agent_like_1",
    messageId: "agent_msg_1",
    segment: {
      id: "agent_text_1",
      kind: "text",
      text: "I'll inspect the docs and package a minimal adapter example.",
    },
  },
  {
    type: "agent.tool.started",
    runId: "run_agent_like_1",
    messageId: "agent_msg_1",
    tool: {
      id: "agent_tool_1",
      name: "searchDocs",
      input: {
        query: "reference mapper adapter example",
      },
    },
  },
  {
    type: "agent.tool.completed",
    runId: "run_agent_like_1",
    messageId: "agent_msg_1",
    tool: {
      id: "agent_tool_1",
      name: "searchDocs",
      input: {
        query: "reference mapper adapter example",
      },
      resultSummary: "Found runtime API and example fixture references",
    },
  },
  {
    type: "agent.artifact.emitted",
    runId: "run_agent_like_1",
    messageId: "agent_msg_1",
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
          mediaType: "application/json",
          value: {
            adapter: "host-event",
            dispatched: true,
          },
        },
        {
          id: "summary",
          label: "Summary",
          mediaType: "application/vnd.uinify.preview",
          value: "Adapter payload ready",
        },
      ],
    },
  },
  {
    type: "agent.message.completed",
    runId: "run_agent_like_1",
    messageId: "agent_msg_1",
  },
]

export const customAgentLikeFixture: AgentLikeEvent[] = [
  {
    type: "agent.message.started",
    runId: "run_custom_agent_like_1",
    message: {
      id: "custom_assistant",
      role: "assistant",
    },
  },
  {
    type: "agent.message.delta",
    runId: "run_custom_agent_like_1",
    messageId: "custom_assistant",
    segment: {
      id: "custom_assistant_text",
      kind: "text",
      text: "Normalize the host event stream first, then let renderers specialize how the artifact is displayed.",
    },
  },
  {
    type: "agent.tool.started",
    runId: "run_custom_agent_like_1",
    messageId: "custom_assistant",
    tool: {
      id: "custom_assistant_tool",
      name: "mapHostEvent",
      input: {
        query: "host event payload",
      },
    },
  },
  {
    type: "agent.tool.completed",
    runId: "run_custom_agent_like_1",
    messageId: "custom_assistant",
    tool: {
      id: "custom_assistant_tool",
      name: "mapHostEvent",
      input: {
        query: "host event payload",
      },
      resultSummary: "UiStreamEvent dispatched",
    },
  },
  {
    type: "agent.artifact.emitted",
    runId: "run_custom_agent_like_1",
    messageId: "custom_assistant",
    artifact: {
      id: "custom_assistant_artifact",
      kind: "code",
      title: "Host adapter dispatch",
      metadata: {
        adapter: "host-event",
        language: "ts",
      },
      defaultViewId: "json",
      views: [
        {
          id: "json",
          label: "JSON",
          mediaType: "application/json",
          value: {
            adapter: "host-event",
            dispatched: true,
          },
        },
      ],
    },
  },
  {
    type: "agent.message.completed",
    runId: "run_custom_agent_like_1",
    messageId: "custom_assistant",
  },
]

export const customMinimalFixture: CustomMinimalEvent[] = [
  {
    kind: "begin",
    id: "custom_min_msg_1",
  },
  {
    kind: "text",
    id: "custom_min_msg_1",
    partId: "custom_min_text_1",
    text: "Mapped from a tiny host protocol.",
  },
  {
    kind: "end",
    id: "custom_min_msg_1",
  },
]
