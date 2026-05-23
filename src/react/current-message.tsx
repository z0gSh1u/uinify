import { createContext, useContext, type PropsWithChildren } from "react"
import type { UiMessage } from "../model/types"

const CurrentMessageContext = createContext<UiMessage | null>(null)

export type CurrentMessageProviderProps = PropsWithChildren<{
  message: UiMessage
}>

export function CurrentMessageProvider({ children, message }: CurrentMessageProviderProps) {
  return <CurrentMessageContext.Provider value={message}>{children}</CurrentMessageContext.Provider>
}

export function useCurrentMessage() {
  return useContext(CurrentMessageContext)
}
