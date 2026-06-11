import { FormEvent, KeyboardEvent, useRef, useState } from "react"
import { createChatRuntime, type UiStreamEvent } from "../../src"
import { ChatRoot, MessageList } from "../../src/react"
import { readSSEStream } from "../../src/sse"
import "./chat.css"

type ApiMessage = {
  role: "user" | "assistant"
  content: string
}

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

function dispatchTextMessage(
  runtime: ReturnType<typeof createChatRuntime>,
  input: { messageId: string; role: "user" | "assistant"; text: string },
) {
  runtime.dispatch({
    type: "message.started",
    messageId: input.messageId,
    role: input.role,
  })
  runtime.dispatch({
    type: "part.text.delta",
    messageId: input.messageId,
    partId: `${input.messageId}-text`,
    delta: input.text,
  })
  runtime.dispatch({
    type: "message.completed",
    messageId: input.messageId,
  })
}

async function readUiEventStream(response: Response, onEvent: (event: UiStreamEvent) => void) {
  if (!response.body) {
    throw new Error("Chat response did not include a stream.")
  }

  for await (const frame of readSSEStream(response.body)) {
    if (frame.event !== "ui") {
      continue
    }

    onEvent(JSON.parse(frame.data) as UiStreamEvent)
  }
}

export function ChatExample() {
  const [runtime] = useState(() => createChatRuntime({ conversationId: "real-chat-example" }))
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesRef = useRef<ApiMessage[]>([])

  const submit = async () => {
    const text = input.trim()

    if (!text || isStreaming) {
      return
    }

    const userMessageId = createId("user")
    const nextMessages: ApiMessage[] = [...messagesRef.current, { role: "user", content: text }]
    let assistantText = ""
    let assistantFailed = false

    messagesRef.current = nextMessages
    setInput("")
    setError(null)
    setIsStreaming(true)
    dispatchTextMessage(runtime, { messageId: userMessageId, role: "user", text })

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: nextMessages }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? `Chat request failed with ${response.status}.`)
      }

      await readUiEventStream(response, (event) => {
        runtime.dispatch(event)

        if (event.type === "part.text.delta") {
          assistantText += event.delta
        }

        if (event.type === "message.failed") {
          assistantFailed = true
          setError(event.error)
        }
      })

      if (assistantText && !assistantFailed) {
        messagesRef.current = [...nextMessages, { role: "assistant", content: assistantText }]
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Chat request failed.")
      messagesRef.current = messagesRef.current.filter((message) => message !== nextMessages.at(-1))
    } finally {
      setIsStreaming(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submit()
  }

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void submit()
    }
  }

  return (
    <section className="chat-route" aria-label="Real OpenAI-compatible chat example">
      <header className="chat-header">
        <div>
          <p>Real model example</p>
          <h2>AI Chat</h2>
        </div>
        <span>{isStreaming ? "Streaming" : "Ready"}</span>
      </header>

      <div className="chat-transcript" data-testid="real-chat-transcript">
        <ChatRoot runtime={runtime}>
          <MessageList style={{ height: "100%", minHeight: "100%" }} />
        </ChatRoot>
      </div>

      <form className="chat-composer" onSubmit={handleSubmit}>
        {error ? <p className="chat-error">{error}</p> : null}
        <div className="chat-composer-row">
          <textarea
            aria-label="Message"
            disabled={isStreaming}
            onChange={(event) => setInput(event.currentTarget.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder="Message the model"
            rows={3}
            value={input}
          />
          <button disabled={isStreaming || input.trim().length === 0} type="submit">
            {isStreaming ? "Sending" : "Send"}
          </button>
        </div>
      </form>
    </section>
  )
}
