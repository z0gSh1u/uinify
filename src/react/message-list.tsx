import { Virtuoso } from "react-virtuoso"
import type { UiMessage } from "../model/types"
import { useChatSession } from "../runtime/use-chat-session"
import { Message } from "./message"
import { useOptionalChatRuntime } from "./chat-root"
import { ErrorBoundary } from "./error-boundary"

export type MessageListProps = {
  messages?: UiMessage[]
}

export function MessageList({ messages }: MessageListProps) {
  const runtime = useOptionalChatRuntime()
  const state = runtime ? useChatSession(runtime) : null
  const items = messages ?? state?.messages ?? []

  return (
    <Virtuoso
      computeItemKey={(_index, message) => message.id}
      data={items}
      followOutput="auto"
      itemContent={(index, message) => (
        <ErrorBoundary
          fallback={<div data-slot="message-error">Message failed to render</div>}
          resetKey={JSON.stringify(message ?? items[index])}
        >
          <Message message={message ?? items[index]!} />
        </ErrorBoundary>
      )}
      totalCount={items.length}
    />
  )
}
