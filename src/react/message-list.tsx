import { Virtuoso } from "react-virtuoso"
import type { CSSProperties } from "react"
import type { createChatRuntime } from "../runtime/create-chat-runtime"
import type { UiRuntimeState, UiMessage } from "../model/types"
import { useChatSession } from "../runtime/use-chat-session"
import { Message } from "./message"
import { useOptionalChatRuntime } from "./chat-root"
import { ErrorBoundary } from "./error-boundary"
import { useRenderers } from "./renderers"

const EMPTY_STATE: UiRuntimeState = {
  conversationId: "default",
  messages: [],
  status: "idle",
  error: null,
  warnings: [],
}

const EMPTY_RUNTIME: ReturnType<typeof createChatRuntime> = {
  getState() {
    return EMPTY_STATE
  },
  setState(_next) {},
  dispatch(_event) {},
  subscribe() {
    return () => false
  },
}

const identityMap = new WeakMap<object, number>()
let nextIdentity = 0

function getIdentityKey(value: object | null | undefined) {
  if (!value) {
    return "none"
  }

  const current = identityMap.get(value)

  if (current) {
    return String(current)
  }

  nextIdentity += 1
  identityMap.set(value, nextIdentity)
  return String(nextIdentity)
}

export type MessageListProps = {
  messages?: UiMessage[]
  style?: CSSProperties
}

export function MessageList({ messages, style }: MessageListProps) {
  const runtime = useOptionalChatRuntime()
  const renderers = useRenderers()
  const state = useChatSession(runtime ?? EMPTY_RUNTIME)
  const items = messages ?? state.messages
  const listStyle = {
    minHeight: "20rem",
    ...style,
  }
  const initialPositionProps =
    items.length > 1
      ? { initialTopMostItemIndex: { align: "end" as const, index: "LAST" as const } }
      : items.length === 1
        ? { initialItemCount: 1 }
        : {}
  const rendererKey = [
    getIdentityKey(renderers.renderReasoning),
    getIdentityKey(renderers.renderStep),
    getIdentityKey(renderers.renderImage),
    getIdentityKey(renderers.artifactRegistry),
    getIdentityKey(renderers.renderArtifactFallback),
    getIdentityKey(runtime),
  ].join(":")

  return (
    <Virtuoso
      computeItemKey={(_index, message) => message.id}
      data={items}
      followOutput="auto"
      {...initialPositionProps}
      style={listStyle}
      itemContent={(index, message) => (
        <ErrorBoundary
          fallback={<div data-slot="message-error">Message failed to render</div>}
          resetKey={`${JSON.stringify(message ?? items[index])}:${rendererKey}`}
        >
          <Message message={message ?? items[index]!} />
        </ErrorBoundary>
      )}
      totalCount={items.length}
    />
  )
}
