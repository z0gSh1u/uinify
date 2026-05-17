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
      return (
        <div data-slot="message-part" data-state="complete" data-type="text">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown>
        </div>
      )
    case "image":
      return (
        <div data-slot="message-part" data-state="complete" data-type="image">
          <ImagePart part={part} />
        </div>
      )
    case "reasoning":
      return (
        <div data-slot="message-part" data-state={part.state} data-type="reasoning">
          <div data-slot="reasoning" data-state={part.state}>
            {renderers.renderReasoning ? <>{renderers.renderReasoning({ part })}</> : <ReasoningBlock part={part} />}
          </div>
        </div>
      )
    case "tool-call":
      return (
        <div data-slot="message-part" data-state={part.status} data-type="tool-call">
          <div data-slot="toolcall" data-state={part.status}>
            {renderers.renderToolCall ? <>{renderers.renderToolCall({ part })}</> : <ToolCallBlock part={part} />}
          </div>
        </div>
      )
    case "artifact":
      return (
        <div data-kind={part.artifact.kind} data-slot="message-part" data-state="complete" data-type="artifact">
          <div data-kind={part.artifact.kind} data-slot={part.artifact.kind === "code" ? "artifact-code" : "artifact-text"}>
            {part.artifact.kind === "code" && renderers.renderArtifactCode ? (
              <>{renderers.renderArtifactCode({ part })}</>
            ) : (
              <ArtifactCodeBlock part={part} />
            )}
          </div>
        </div>
      )
    default: {
      const exhaustiveCheck: never = part
      return exhaustiveCheck
    }
  }
}
