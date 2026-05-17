import type { UiMessage } from "../model/types"
import { FeedbackButtons } from "./feedback-buttons"
import { MessagePart } from "./message-part"

export type MessageProps = {
  message: UiMessage
  onFeedback?: (feedback: Exclude<UiMessage["feedback"], "none">) => void
}

export function Message({ message, onFeedback }: MessageProps) {
  return (
    <article data-message-role={message.role} data-message-state={message.state}>
      {message.parts.map((part) => (
        <MessagePart key={part.id} part={part} />
      ))}
      <FeedbackButtons onSelect={onFeedback} value={message.feedback} />
    </article>
  )
}
