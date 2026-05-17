import { createContext, useContext, type PropsWithChildren } from "react"
import type { createChatRuntime } from "../runtime/create-chat-runtime"
import { RenderersProvider, type MessageRendererOverrides } from "./renderers"

const RuntimeContext = createContext<ReturnType<typeof createChatRuntime> | null>(null)

export type ChatRootProps = PropsWithChildren<{
  runtime: ReturnType<typeof createChatRuntime>
  renderers?: MessageRendererOverrides
}>

export function ChatRoot({ children, runtime, renderers }: ChatRootProps) {
  return (
    <RuntimeContext.Provider value={runtime}>
      <RenderersProvider value={renderers}>{children}</RenderersProvider>
    </RuntimeContext.Provider>
  )
}

export function useChatRuntime() {
  const runtime = useContext(RuntimeContext)

  if (!runtime) {
    throw new Error("useChatRuntime must be used inside ChatRoot")
  }

  return runtime
}
