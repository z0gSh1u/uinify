import { createChatRuntime, type UiStreamEvent } from "../src"
import { mapAgentLikeEvent } from "./adapters/agent-like"
import { agentLikeFixture, customAgentLikeFixture } from "./adapters/protocol-fixtures"

export type ExampleFixture = {
  id: "simple" | "tool" | "artifact" | "custom"
  category: "getting-started" | "integration" | "advanced"
  title: string
  description: string
  events: UiStreamEvent[]
}

const exampleCategoryTitles: Record<ExampleFixture["category"], string> = {
  "getting-started": "Getting started",
  integration: "Integration",
  advanced: "Advanced",
}

const mappedAgentLikeEvents = agentLikeFixture.flatMap(mapAgentLikeEvent)
const mappedCustomAgentLikeEvents = customAgentLikeFixture.flatMap(mapAgentLikeEvent)

export const exampleFixtures: ExampleFixture[] = [
  {
    id: "simple",
    category: "getting-started",
    title: "Starter chat flow",
    description: "Smallest end-to-end chat transcript using normalized runtime events",
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
    category: "integration",
    title: "Integration mapper flow",
    description: "Adapter-mapped host events with tool activity routed into the shared transcript",
    events: [
      { type: "message.started", messageId: "tool-user", role: "user" },
      {
        type: "part.text.delta",
        messageId: "tool-user",
        partId: "tool-user-text",
        delta: "Search the docs for SSE support.",
      },
      { type: "message.completed", messageId: "tool-user" },
      ...mappedAgentLikeEvents.filter((event) => event.type !== "part.artifact.emitted"),
    ],
  },
  {
    id: "artifact",
    category: "advanced",
    title: "Upload lifecycle flow",
    description: "Attachment parts moving from queued to uploaded inside one assistant handoff",
    events: [
      { type: "message.started", messageId: "artifact-user", role: "user" },
      {
        type: "part.text.delta",
        messageId: "artifact-user",
        partId: "artifact-user-text",
        delta: "Attach the release notes and confirm when the upload finishes.",
      },
      { type: "message.completed", messageId: "artifact-user" },
      { type: "message.started", messageId: "artifact-assistant", role: "assistant" },
      {
        type: "part.text.delta",
        messageId: "artifact-assistant",
        partId: "artifact-assistant-text",
        delta: "The file is uploading now, then I'll attach the final artifact link.",
      },
      {
        type: "part.attachment.updated",
        messageId: "artifact-assistant",
        partId: "artifact-assistant-attachment",
        attachment: {
          id: "release-notes",
          name: "release-notes.pdf",
          mimeType: "application/pdf",
          size: 204800,
          status: "queued",
        },
      },
      {
        type: "part.attachment.updated",
        messageId: "artifact-assistant",
        partId: "artifact-assistant-attachment",
        attachment: {
          id: "release-notes",
          name: "release-notes.pdf",
          mimeType: "application/pdf",
          size: 204800,
          status: "uploading",
          progress: 65,
        },
      },
      {
        type: "part.attachment.updated",
        messageId: "artifact-assistant",
        partId: "artifact-assistant-attachment",
        attachment: {
          id: "release-notes",
          name: "release-notes.pdf",
          mimeType: "application/pdf",
          size: 204800,
          status: "uploaded",
          progress: 100,
          remoteUrl: "https://example.com/release-notes.pdf",
        },
      },
      { type: "message.completed", messageId: "artifact-assistant" },
    ],
  },
  {
    id: "custom",
    category: "advanced",
    title: "Artifact registry customization",
    description: "Host-provided artifact registry overrides layered onto normalized adapter output",
    events: [
      { type: "message.started", messageId: "custom-user", role: "user" },
      {
        type: "part.text.delta",
        messageId: "custom-user",
        partId: "custom-user-text",
        delta: "Show how a host can adapt events and customize rendering.",
      },
      { type: "message.completed", messageId: "custom-user" },
      ...mappedCustomAgentLikeEvents,
    ],
  },
]

export const exampleFixtureSections = (Object.keys(exampleCategoryTitles) as ExampleFixture["category"][])
  .map((category) => ({
    id: category,
    title: exampleCategoryTitles[category],
    fixtures: exampleFixtures.filter((fixture) => fixture.category === category),
  }))
  .filter((section) => section.fixtures.length > 0)

export function createExampleRuntime(fixture: ExampleFixture) {
  const runtime = createChatRuntime({ conversationId: `example-${fixture.id}` })

  for (const event of fixture.events) {
    runtime.dispatch(event)
  }

  return runtime
}
