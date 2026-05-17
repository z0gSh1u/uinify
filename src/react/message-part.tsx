import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { UiMessagePart } from "../model/types"
import { ArtifactCodeBlock } from "./artifact-code-block"
import { ImagePart } from "./image-part"
import { ReasoningBlock } from "./reasoning-block"
import { useRenderers } from "./renderers"
import { ToolCallBlock } from "./tool-call-block"

export type MessagePartProps = {
  part: UiMessagePart
}

export function MessagePart({ part }: MessagePartProps) {
  const renderers = useRenderers()

  switch (part.kind) {
    case "text":
      return <ReactMarkdown remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown>
    case "image":
      return <ImagePart part={part} />
    case "reasoning":
      return renderers.renderReasoning ? (
        <>{renderers.renderReasoning({ part })}</>
      ) : (
        <ReasoningBlock part={part} />
      )
    case "tool-call":
      return renderers.renderToolCall ? (
        <>{renderers.renderToolCall({ part })}</>
      ) : (
        <ToolCallBlock part={part} />
      )
    case "artifact":
      return renderers.renderArtifactCode ? (
        <>{renderers.renderArtifactCode({ artifact: part.artifact })}</>
      ) : (
        <ArtifactCodeBlock artifact={part.artifact} />
      )
    default: {
      const exhaustiveCheck: never = part
      return exhaustiveCheck
    }
  }
}
