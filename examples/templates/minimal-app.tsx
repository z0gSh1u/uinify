import { useState } from "react"
import { createChatRuntime, type UiComposerValue } from "../../src"
import { LexicalComposer } from "../../src/composer/lexical"
import { ChatRoot, MessageList } from "../../src/react"

export function MinimalAppTemplate() {
  const [runtime] = useState(() => {
    const next = createChatRuntime({ conversationId: "template-minimal" })

    next.dispatch({ type: "message.started", messageId: "minimal-user", role: "user" })
    next.dispatch({
      type: "part.text.delta",
      messageId: "minimal-user",
      partId: "minimal-user-text",
      delta: "Show the smallest uinify chat shell.",
    })
    next.dispatch({ type: "message.completed", messageId: "minimal-user" })
    next.dispatch({ type: "message.started", messageId: "minimal-assistant", role: "assistant" })
    next.dispatch({
      type: "part.text.delta",
      messageId: "minimal-assistant",
      partId: "minimal-assistant-text",
      delta: "A runtime, ChatRoot, MessageList, and LexicalComposer are enough to start.",
    })
    next.dispatch({ type: "message.completed", messageId: "minimal-assistant" })

    return next
  })

  function handleSubmit(value: UiComposerValue) {
    const text = value.text.trim()

    if (text.length === 0) {
      return
    }

    const userMessageId = `minimal-user-${Date.now()}`
    const assistantMessageId = `minimal-assistant-${Date.now()}`

    runtime.dispatch({ type: "message.started", messageId: userMessageId, role: "user" })
    runtime.dispatch({
      type: "part.text.delta",
      messageId: userMessageId,
      partId: `${userMessageId}-text`,
      delta: text,
    })
    runtime.dispatch({ type: "message.completed", messageId: userMessageId })

    runtime.dispatch({ type: "message.started", messageId: assistantMessageId, role: "assistant" })
    runtime.dispatch({
      type: "part.text.delta",
      messageId: assistantMessageId,
      partId: `${assistantMessageId}-text`,
      delta: `Received host-owned turn: ${text}`,
    })
    runtime.dispatch({ type: "message.completed", messageId: assistantMessageId })
  }

  return (
    <section>
      <h2>Minimal app template</h2>
      <p>Smallest copyable runtime plus transcript wiring for a host app.</p>
      <ChatRoot runtime={runtime}>
        <>
          <MessageList />
          <LexicalComposer onSubmit={handleSubmit} />
        </>
      </ChatRoot>
    </section>
  )
}
