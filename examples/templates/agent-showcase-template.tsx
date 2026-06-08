import { useState } from "react"
import { createChatRuntime } from "../../src"
import { ChatRoot, MessageList } from "../../src/react"

const sketchUrl =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'%3E%3Crect width='320' height='180' rx='16' fill='%23eff6ff'/%3E%3Cpath d='M44 48h232v84H44z' fill='white' stroke='%233b82f6' stroke-width='4'/%3E%3Cpath d='M68 76h88M68 104h132M220 72l32 24-32 24z' stroke='%231d4ed8' stroke-width='6' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E"

const submittedCommandPayload = [
  {
    id: "agent-research",
    kind: "agent",
    label: "Researcher",
    insertText: "@researcher ",
    trigger: "@",
    metadata: { agentId: "researcher" },
  },
  {
    id: "mcp-browser-search",
    kind: "mcp",
    label: "browser.search",
    insertText: "/browser.search ",
    trigger: "/",
    metadata: { server: "browser", tool: "search" },
  },
] as const

export function AgentShowcaseTemplate() {
  const [runtime] = useState(() => {
    const next = createChatRuntime({ conversationId: "template-agent-showcase" })

    next.dispatch({ type: "message.started", messageId: "showcase-user", role: "user" })
    next.dispatch({
      type: "part.text.delta",
      messageId: "showcase-user",
      partId: "showcase-user-text",
      delta: "@researcher explain this launch sketch with mcp:browser.search context.",
    })
    next.dispatch({
      type: "part.text.delta",
      messageId: "showcase-user",
      partId: "showcase-user-command-metadata",
      delta: "Selected command metadata: agent=researcher, mcp=browser.search",
    })
    next.dispatch({
      type: "part.image.emitted",
      messageId: "showcase-user",
      partId: "showcase-user-image",
      image: {
        url: sketchUrl,
        alt: "Uploaded product sketch",
        mimeType: "image/svg+xml",
        width: 320,
        height: 180,
        sourceAttachmentId: "showcase-sketch-attachment",
      },
    })
    next.dispatch({ type: "message.completed", messageId: "showcase-user" })

    next.dispatch({ type: "message.started", messageId: "showcase-assistant", role: "assistant" })
    next.dispatch({
      type: "part.reasoning.delta",
      messageId: "showcase-assistant",
      partId: "showcase-reasoning",
      delta: "I will combine command intent, image context, and tool-backed retrieval before answering.",
    })
    next.dispatch({
      type: "part.step.started",
      messageId: "showcase-assistant",
      partId: "showcase-plan",
      category: "planner",
      label: "Plan response",
      inputSummary: "Selected command: @researcher",
    })
    next.dispatch({
      type: "part.step.completed",
      messageId: "showcase-assistant",
      partId: "showcase-plan",
      outputSummary: "Explain the sketch, cite the docs layer, and keep execution host-owned.",
    })
    next.dispatch({
      type: "part.step.started",
      messageId: "showcase-assistant",
      partId: "showcase-retrieval",
      category: "retrieval",
      label: "Search docs",
      inputSummary: "mcp:browser.search for layered public API docs",
    })
    next.dispatch({
      type: "part.step.completed",
      messageId: "showcase-assistant",
      partId: "showcase-retrieval",
      outputSummary: "Found guidance for core, transcript, composer, adapter, and theme layers.",
    })
    next.dispatch({
      type: "part.step.started",
      messageId: "showcase-assistant",
      partId: "showcase-tool",
      category: "tool",
      label: "Inspect image",
      inputSummary: "Image part: Uploaded product sketch",
    })
    next.dispatch({
      type: "part.step.completed",
      messageId: "showcase-assistant",
      partId: "showcase-tool",
      outputSummary: "The sketch shows a card layout with a call-to-action arrow.",
    })
    next.dispatch({
      type: "part.step.started",
      messageId: "showcase-assistant",
      partId: "showcase-skill",
      category: "skill",
      label: "Apply product writing skill",
      inputSummary: "Turn findings into concise launch copy.",
    })
    next.dispatch({
      type: "part.step.completed",
      messageId: "showcase-assistant",
      partId: "showcase-skill",
      outputSummary: "Prepared a user-facing summary.",
    })
    next.dispatch({
      type: "part.text.delta",
      messageId: "showcase-assistant",
      partId: "showcase-answer",
      delta:
        "Showcase complete: command intent stayed in the composer payload, the image rendered as a transcript part, and agent work appeared as steps.",
    })
    next.dispatch({ type: "message.completed", messageId: "showcase-assistant" })

    return next
  })

  return (
    <section>
      <h2>Layered agent UI showcase</h2>
      <p>Commands, image input, and agent steps composed through public contracts.</p>
      <div aria-label="Submitted command intent" className="example-command-chips">
        <span>@researcher</span>
        <span>mcp:browser.search</span>
      </div>
      <ChatRoot runtime={runtime}>
        <MessageList />
      </ChatRoot>
      <details className="example-details">
        <summary>Command payload</summary>
        <pre>{JSON.stringify(submittedCommandPayload, null, 2)}</pre>
      </details>
    </section>
  )
}
