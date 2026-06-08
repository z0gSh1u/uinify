import { useState } from "react"
import { createChatRuntime } from "../../src"
import {
  ChatRoot,
  MessageList,
  renderDefaultArtifactBody,
  type MessageRendererOverrides,
} from "../../src/react"

const renderers: MessageRendererOverrides = {
  artifactRegistry: {
    code: ({ artifact, part, view }) => (
      <section>
        <h3>{artifact.title ?? "Artifact customization template"}</h3>
        <p>Part id: {part.id}</p>
        {renderDefaultArtifactBody({ artifact, part, view })}
      </section>
    ),
  },
}

export function ArtifactTemplate() {
  const [runtime] = useState(() => {
    const next = createChatRuntime({ conversationId: "template-artifact" })

    next.dispatch({ type: "message.started", messageId: "artifact-assistant", role: "assistant" })
    next.dispatch({
      type: "part.artifact.emitted",
      messageId: "artifact-assistant",
      partId: "artifact-part",
      artifact: {
        id: "artifact-1",
        kind: "code",
        title: "Artifact customization template",
        metadata: {
          language: "TypeScript",
          renderer: "custom registry",
        },
        views: [
          {
            id: "source",
            label: "Source",
            kind: "source",
            language: "ts",
            value: "const customized = true",
          },
        ],
      },
    })
    next.dispatch({ type: "message.completed", messageId: "artifact-assistant" })

    return next
  })

  return (
    <section>
      <h2>Artifact customization template</h2>
      <p>Artifact registry overrides customize rendering without replacing the container shell.</p>
      <ChatRoot runtime={runtime} renderers={renderers}>
        <MessageList />
      </ChatRoot>
    </section>
  )
}
