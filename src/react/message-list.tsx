import { Virtuoso } from "react-virtuoso"
import type { UiMessage } from "../model/types"
import { useChatSession } from "../runtime/use-chat-session"
import { Message } from "./message"
import { useChatRuntime } from "./chat-root"
import { ErrorBoundary } from "./error-boundary"

export type MessageListProps = {
  messages?: UiMessage[]
}

export function MessageList({ messages }: MessageListProps) {
  const runtime = useChatRuntime()
  const state = useChatSession(runtime)
  const items = messages ?? state.messages

  return (
    <Virtuoso
      data={items}
      followOutput="auto"
      itemContent={(index, message) => (
        <ErrorBoundary fallback={<div data-slot="message-error">Message failed to render</div>}>
          <Message message={message ?? items[index]!} />
        </ErrorBoundary>
      )}
      totalCount={items.length}
    />
  )
}
