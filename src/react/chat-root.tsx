import { createContext, useContext, type PropsWithChildren } from "react"
import type { createChatRuntime } from "../runtime/create-chat-runtime"
import { RenderersProvider, type MessageRendererOverrides } from "./renderers"

const RuntimeContext = createContext<ReturnType<typeof createChatRuntime> | null>(null)
const SlotClassNamesContext = createContext<SlotClassNames>({})

export type SlotClassNames = Partial<{
  message: string
  messageParts: string
  attachmentItem: string
}>

export type ChatRootProps = PropsWithChildren<{
  runtime: ReturnType<typeof createChatRuntime>
  renderers?: MessageRendererOverrides
  slotClassNames?: SlotClassNames
}>

export function ChatRoot({ children, runtime, renderers, slotClassNames }: ChatRootProps) {
  return (
    <RuntimeContext.Provider value={runtime}>
      <SlotClassNamesContext.Provider value={slotClassNames ?? {}}>
        <RenderersProvider value={renderers}>{children}</RenderersProvider>
      </SlotClassNamesContext.Provider>
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
