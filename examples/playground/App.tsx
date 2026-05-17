import { useState } from "react"
import type { MessageRendererOverrides } from "../../src/react"
import { ChatRoot, MessageList, renderDefaultArtifactBody } from "../../src/react"
import { createExampleRuntime, exampleFixtureSections, type ExampleFixture } from "../fixtures"

const customRenderers: MessageRendererOverrides = {
  artifactRegistry: {
    code: ({ artifact, view }) => {
      const language = view.language ?? artifact.metadata?.language ?? "code"
      const value = renderDefaultArtifactBody({ artifact, part: { id: "example-artifact", kind: "artifact", artifact }, view })

      return (
        <div>
          <div>Artifact registry override ({language}):</div>
          {value}
        </div>
      )
    },
  },
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
      {exampleFixtureSections.map((group) => {
        return (
          <section key={group.id}>
            <h2>{group.title}</h2>
            {group.fixtures.map((fixture) => (
              <ExampleScenario key={fixture.id} fixture={fixture} />
            ))}
          </section>
        )
      })}
    </main>
  )
}
