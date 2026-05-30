import { createContext, useContext, useEffect, useRef, type PropsWithChildren } from "react"
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
  messageActions: string
  partActions: string
  attachmentItem: string
  attachmentTray: string
  artifactContainer: string
  artifactTabs: string
  step: string
  image: string
}>

const stableSlotSelectors: Record<keyof SlotClassNames, string> = {
  message: "message",
  messageParts: "message-parts",
  messageActions: "message-actions",
  partActions: "part-actions",
  attachmentItem: "attachment-item",
  attachmentTray: "attachment-tray",
  artifactContainer: "artifact-container",
  artifactTabs: "artifact-tabs",
  step: "step",
  image: "image",
}

function splitClassNames(value: string | undefined) {
  return value?.split(/\s+/).filter(Boolean) ?? []
}

function updateSlotClasses(element: HTMLElement, previous: string | undefined, current: string | undefined) {
  const previousTokens = splitClassNames(previous)
  const currentTokens = splitClassNames(current)

  if (previousTokens.length > 0) {
    element.classList.remove(...previousTokens)
  }

  if (currentTokens.length > 0) {
    element.classList.add(...currentTokens)
  }
}

function applySlotClasses(node: ParentNode, previous: SlotClassNames, current: SlotClassNames) {
  for (const [slotKey, slotName] of Object.entries(stableSlotSelectors) as [keyof SlotClassNames, string][]) {
    const previousClassName = previous[slotKey]
    const currentClassName = current[slotKey]

    if (!previousClassName && !currentClassName) {
      continue
    }

    if (node instanceof HTMLElement && node.dataset.slot === slotName) {
      updateSlotClasses(node, previousClassName, currentClassName)
    }

    const elements = node.querySelectorAll<HTMLElement>(`[data-slot="${slotName}"]`)

    elements.forEach((element) => {
      updateSlotClasses(element, previousClassName, currentClassName)
    })
  }
}

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
  const rootRef = useRef<HTMLDivElement | null>(null)
  const previousSlotClassNamesRef = useRef<SlotClassNames>({})
  const currentSlotClassNames = slotClassNames ?? {}

  useEffect(() => {
    const root = rootRef.current

    if (!root) {
      return
    }

    const applyClasses = (node: ParentNode, previous: SlotClassNames) => {
      applySlotClasses(node, previous, currentSlotClassNames)
      previousSlotClassNamesRef.current = currentSlotClassNames
    }

    applyClasses(root, previousSlotClassNamesRef.current)

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            applyClasses(node, {})
          }
        })
      }
    })

    observer.observe(root, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
    }
  }, [currentSlotClassNames])

  return (
    <RuntimeContext.Provider value={runtime}>
      <ChatActionHandlersContext.Provider value={{ onMessageAction, onPartAction }}>
        <SlotClassNamesContext.Provider value={slotClassNames ?? {}}>
          <div ref={rootRef} style={{ display: "contents" }}>
            <RenderersProvider value={renderers}>{children}</RenderersProvider>
          </div>
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
