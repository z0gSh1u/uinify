import { createContext, useContext, type PropsWithChildren, type ReactNode } from "react"
import type { UiArtifact, UiReasoningPart, UiToolCallPart } from "../model/types"

export type ReasoningRendererProps = {
  part: UiReasoningPart
}

export type ToolCallRendererProps = {
  part: UiToolCallPart
}

export type ArtifactCodeRendererProps = {
  artifact: UiArtifact
}

export type MessageRendererOverrides = {
  renderReasoning?: (props: ReasoningRendererProps) => ReactNode
  renderToolCall?: (props: ToolCallRendererProps) => ReactNode
  renderArtifactCode?: (props: ArtifactCodeRendererProps) => ReactNode
}

const RenderersContext = createContext<MessageRendererOverrides>({})

export function RenderersProvider({
  children,
  value,
}: PropsWithChildren<{ value?: MessageRendererOverrides }>) {
  return <RenderersContext.Provider value={value ?? {}}>{children}</RenderersContext.Provider>
}

export function useRenderers() {
  return useContext(RenderersContext)
}
