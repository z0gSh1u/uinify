import { createContext, useContext, type PropsWithChildren } from "react"
import type { UiMessageRole, UiMessagePart } from "../model/types"
import type { UiMessageActionId, UiOpenArtifactViewPayload, UiPartActionId } from "./actions"
import type { createChatRuntime } from "../runtime/create-chat-runtime"
import { RenderersProvider, type MessageRendererOverrides } from "./renderers"

const RuntimeContext = createContext<ReturnType<typeof createChatRuntime> | null>(null)
const SlotClassNamesContext = createContext<SlotClassNames>({})
const ChatActionHandlersContext = createContext<ChatActionHandlers>({})

export type SlotClassNames = Partial<{
  message: string
  messageParts: string
  attachmentItem: string
}>

export type ChatRootProps = PropsWithChildren<{
  runtime: ReturnType<typeof createChatRuntime>
  renderers?: MessageRendererOverrides
  slotClassNames?: SlotClassNames
  onMessageAction?: (payload: MessageActionPayload) => void
  onPartAction?: (payload: PartActionPayload) => void
}>

export type MessageActionPayload = {
  action: UiMessageActionId
  messageId: string
  role: UiMessageRole
}

export type BasePartActionPayload = {
  action: Exclude<UiPartActionId, "open-artifact-view">
  messageId: string
  partId: string
  partKind: UiMessagePart["kind"]
}

export type OpenArtifactViewActionPayload = UiOpenArtifactViewPayload & {
  messageId: string
  partKind: "artifact"
}

export type PartActionPayload = BasePartActionPayload | OpenArtifactViewActionPayload

export type ChatActionHandlers = {
  onMessageAction?: (payload: MessageActionPayload) => void
  onPartAction?: (payload: PartActionPayload) => void
}

export function ChatRoot({
  children,
  runtime,
  renderers,
  slotClassNames,
  onMessageAction,
  onPartAction,
}: ChatRootProps) {
  return (
    <RuntimeContext.Provider value={runtime}>
      <ChatActionHandlersContext.Provider value={{ onMessageAction, onPartAction }}>
        <SlotClassNamesContext.Provider value={slotClassNames ?? {}}>
          <RenderersProvider value={renderers}>{children}</RenderersProvider>
        </SlotClassNamesContext.Provider>
      </ChatActionHandlersContext.Provider>
    </RuntimeContext.Provider>
  )
}

export function useChatRuntime() {
  const runtime = useOptionalChatRuntime()

  if (!runtime) {
    throw new Error("useChatRuntime must be used inside ChatRoot")
  }

  return runtime
}

export function useOptionalChatRuntime() {
  return useContext(RuntimeContext)
}

export function useSlotClassNames() {
  return useContext(SlotClassNamesContext)
}

export function useChatActionHandlers() {
  return useContext(ChatActionHandlersContext)
}
