import { useState } from "react"
import { createChatRuntime } from "../../src"
import { ChatRoot, MessageList } from "../../src/react"

export function MinimalAppTemplate() {
  const [runtime] = useState(() => {
    const next = createChatRuntime({ conversationId: "template-minimal" })

    next.dispatch({ type: "message.started", messageId: "minimal-assistant", role: "assistant" })
    next.dispatch({
      type: "part.text.delta",
      messageId: "minimal-assistant",
      partId: "minimal-assistant-text",
      delta: "Minimal app template",
    })
    next.dispatch({ type: "message.completed", messageId: "minimal-assistant" })

    return next
  })

  return (
    <section>
      <h2>Minimal app template</h2>
      <p>Smallest copyable runtime plus transcript wiring for a host app.</p>
      <ChatRoot runtime={runtime}>
        <MessageList />
      </ChatRoot>
    </section>
  )
}
