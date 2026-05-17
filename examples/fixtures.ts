import { createChatRuntime, type UiStreamEvent } from "../src"

export type ExampleFixture = {
  id: "simple" | "tool" | "artifact" | "custom"
  title: string
  description: string
  events: UiStreamEvent[]
}

export const exampleFixtures: ExampleFixture[] = [
  {
    id: "simple",
    title: "Simple assistant",
    description: "Text-only assistant flow",
    events: [
      { type: "message.started", messageId: "simple-user", role: "user" },
      {
        type: "part.text.delta",
        messageId: "simple-user",
        partId: "simple-user-text",
        delta: "Summarize what uinify does.",
      },
      { type: "message.completed", messageId: "simple-user" },
      { type: "message.started", messageId: "simple-assistant", role: "assistant" },
      {
        type: "part.text.delta",
        messageId: "simple-assistant",
        partId: "simple-assistant-text",
        delta: "Uinify provides a normalized chat runtime and React UI primitives.",
      },
      { type: "message.completed", messageId: "simple-assistant" },
    ],
  },
  {
    id: "tool",
    title: "Tool-calling agent",
    description: "Assistant response with tool call part",
    events: [
      { type: "message.started", messageId: "tool-user", role: "user" },
      {
        type: "part.text.delta",
        messageId: "tool-user",
        partId: "tool-user-text",
        delta: "Search the docs for SSE support.",
      },
      { type: "message.completed", messageId: "tool-user" },
      { type: "message.started", messageId: "tool-assistant", role: "assistant" },
      {
        type: "part.tool.updated",
        messageId: "tool-assistant",
        partId: "tool-assistant-call",
        toolName: "searchDocs",
        status: "complete",
        inputSummary: "Query: SSE support",
        outputSummary: "Found stream parser and fetch wrapper APIs",
      },
      {
        type: "part.text.delta",
        messageId: "tool-assistant",
        partId: "tool-assistant-text",
        delta: "The SSE helpers live under the dedicated subpath export.",
      },
      { type: "message.completed", messageId: "tool-assistant" },
    ],
  },
  {
    id: "artifact",
    title: "Reasoning + code artifact",
    description: "Reasoning block plus emitted code artifact",
    events: [
      { type: "message.started", messageId: "artifact-user", role: "user" },
      {
        type: "part.text.delta",
        messageId: "artifact-user",
        partId: "artifact-user-text",
        delta: "Draft a tiny runtime example.",
      },
      { type: "message.completed", messageId: "artifact-user" },
      { type: "message.started", messageId: "artifact-assistant", role: "assistant" },
      {
        type: "part.reasoning.delta",
        messageId: "artifact-assistant",
        partId: "artifact-assistant-reasoning",
        delta: "Plan the response first, then emit a working snippet.",
      },
      {
        type: "part.artifact.emitted",
        messageId: "artifact-assistant",
        partId: "artifact-assistant-code",
        artifact: {
          id: "artifact-snippet",
          kind: "code",
          language: "ts",
          content: "const runtime = createChatRuntime({ conversationId: 'demo' })",
        },
      },
      { type: "message.completed", messageId: "artifact-assistant" },
    ],
  },
  {
    id: "custom",
    title: "Custom renderer + adapter",
    description: "Host-provided renderer overrides and normalized events",
    events: [
      { type: "message.started", messageId: "custom-user", role: "user" },
      {
        type: "part.text.delta",
        messageId: "custom-user",
        partId: "custom-user-text",
        delta: "Show how a host can adapt events and customize rendering.",
      },
      { type: "message.completed", messageId: "custom-user" },
      { type: "message.started", messageId: "custom-assistant", role: "assistant" },
      {
        type: "part.reasoning.delta",
        messageId: "custom-assistant",
        partId: "custom-assistant-reasoning",
        delta: "Normalize host protocol events before they reach the UI.",
      },
      {
        type: "part.tool.updated",
        messageId: "custom-assistant",
        partId: "custom-assistant-tool",
        toolName: "mapHostEvent",
        status: "complete",
        inputSummary: "Host event payload",
        outputSummary: "UiStreamEvent dispatched",
      },
      {
        type: "part.artifact.emitted",
        messageId: "custom-assistant",
        partId: "custom-assistant-artifact",
        artifact: {
          id: "custom-adapter-artifact",
          kind: "text",
          content: "Custom renderers can highlight adapted runtime state.",
        },
      },
      { type: "message.completed", messageId: "custom-assistant" },
    ],
  },
]

export function createExampleRuntime(fixture: ExampleFixture) {
  const runtime = createChatRuntime({ conversationId: `example-${fixture.id}` })

  for (const event of fixture.events) {
    runtime.dispatch(event)
  }

  return runtime
}
