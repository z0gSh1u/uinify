import { useState } from "react"
import type { MessageRendererOverrides } from "../../src/react"
import { ChatRoot, MessageList } from "../../src/react"
import { createExampleRuntime, exampleFixtures, type ExampleFixture } from "../fixtures"

const customRenderers: MessageRendererOverrides = {
  renderReasoning: ({ part }) => <div>Adapter note: {part.text}</div>,
  renderToolCall: ({ part }) => (
    <div>
      <strong>Custom tool:</strong> {part.toolName}
      {part.outputSummary ? <p>{part.outputSummary}</p> : null}
    </div>
  ),
  renderArtifactCode: ({ part }) => <div>Custom artifact: {part.artifact.content}</div>,
}

function ExampleScenario({ fixture }: { fixture: ExampleFixture }) {
  const [runtime] = useState(() => createExampleRuntime(fixture))

  return (
    <section>
      <h2>{fixture.title}</h2>
      <p>{fixture.description}</p>
      <ChatRoot
        renderers={fixture.id === "custom" ? customRenderers : undefined}
        runtime={runtime}
      >
        <MessageList />
      </ChatRoot>
    </section>
  )
}

export function ExamplePlayground() {
  return (
    <main>
      <h1>uinify examples</h1>
      {exampleFixtures.map((fixture) => (
        <ExampleScenario key={fixture.id} fixture={fixture} />
      ))}
    </main>
  )
}
