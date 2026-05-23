import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { UiMessagePart } from "../model/types"
import { AttachmentPart } from "./attachment-part"
import { ArtifactContainer } from "./artifact-container"
import { useCurrentMessage } from "./current-message"
import { ImagePart } from "./image-part"
import { PartActions } from "./part-actions"
import { ReasoningBlock } from "./reasoning-block"
import { useChatActionHandlers } from "./chat-root"
import { useRenderers } from "./renderers"
import { ToolCallBlock } from "./tool-call-block"

export type MessagePartProps = {
  part: UiMessagePart
}

export function MessagePart({ part }: MessagePartProps) {
  const message = useCurrentMessage()
  const { onPartAction } = useChatActionHandlers()
  const renderers = useRenderers()

  function renderActions() {
    if (!message) {
      return null
    }

    return <PartActions message={message} part={part} />
  }

  switch (part.kind) {
    case "text":
      return (
        <div data-slot="message-part" data-state="complete" data-type="text">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown>
          {renderActions()}
        </div>
      )
    case "image":
      return (
        <div data-slot="message-part" data-state="complete" data-type="image">
          <ImagePart part={part} />
          {renderActions()}
        </div>
      )
    case "reasoning":
      return (
        <div data-slot="message-part" data-state={part.state} data-type="reasoning">
          <div data-slot="reasoning" data-state={part.state}>
            {renderers.renderReasoning ? (
              <>{renderers.renderReasoning({ part })}</>
            ) : (
              <ReasoningBlock
                onToggle={() => {
                  if (message) {
                    onPartAction?.({
                      action: "toggle-reasoning",
                      messageId: message.id,
                      partId: part.id,
                      partKind: part.kind,
                    })
                  }
                }}
                part={part}
              />
            )}
          </div>
          {renderActions()}
        </div>
      )
    case "tool-call":
      return (
        <div data-slot="message-part" data-state={part.status} data-type="tool-call">
          <div data-slot="toolcall" data-state={part.status}>
            {renderers.renderToolCall ? (
              <>{renderers.renderToolCall({ part })}</>
            ) : (
              <ToolCallBlock
                onToggleDetails={() => {
                  if (message) {
                    onPartAction?.({
                      action: "toggle-tool-details",
                      messageId: message.id,
                      partId: part.id,
                      partKind: part.kind,
                    })
                  }
                }}
                part={part}
              />
            )}
          </div>
          {renderActions()}
        </div>
      )
    case "artifact":
      return (
        <div data-kind={part.artifact.kind} data-slot="message-part" data-state="complete" data-type="artifact">
          <div data-kind={part.artifact.kind} data-slot={part.artifact.kind === "code" ? "artifact-code" : "artifact-text"}>
            <ArtifactContainer part={part} />
          </div>
          {renderActions()}
        </div>
      )
    case "attachment":
      return (
        <div data-slot="message-part" data-state={part.attachment.status} data-type="attachment">
          <AttachmentPart part={part} />
          {renderActions()}
        </div>
      )
    default: {
      const exhaustiveCheck: never = part
      return exhaustiveCheck
    }
  }
}
