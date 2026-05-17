import { createContext, useContext, type PropsWithChildren, type ReactNode } from "react"
import type { UiArtifact, UiArtifactPart, UiArtifactView, UiReasoningPart, UiToolCallPart } from "../model/types"

export type ReasoningRendererProps = {
  part: UiReasoningPart
}

export type ToolCallRendererProps = {
  part: UiToolCallPart
}

export type ArtifactRendererProps = {
  artifact: UiArtifact
  part: UiArtifactPart
  view: UiArtifactView
}

export type MessageRendererOverrides = {
  renderReasoning?: (props: ReasoningRendererProps) => ReactNode
  renderToolCall?: (props: ToolCallRendererProps) => ReactNode
  artifactRegistry?: Record<string, (props: ArtifactRendererProps) => ReactNode>
  renderArtifactFallback?: (props: ArtifactRendererProps) => ReactNode
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
