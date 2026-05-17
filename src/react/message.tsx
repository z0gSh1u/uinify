import type { UiMessage } from "../model/types"
import { useSlotClassNames } from "./chat-root"
import { FeedbackButtons } from "./feedback-buttons"
import { MessagePart } from "./message-part"

export type MessageProps = {
  message: UiMessage
  onFeedback?: (feedback: Exclude<UiMessage["feedback"], "none">) => void
}

export function Message({ message, onFeedback }: MessageProps) {
  const slotClassNames = useSlotClassNames()

  return (
    <article
      className={slotClassNames.message}
      data-feedback={message.feedback}
      data-message-role={message.role}
      data-message-state={message.state}
      data-role={message.role}
      data-slot="message"
      data-state={message.state}
    >
      <div className={slotClassNames.messageParts} data-slot="message-parts">
        {message.parts.map((part) => (
          <MessagePart key={part.id} part={part} />
        ))}
      </div>
      <FeedbackButtons onSelect={onFeedback} value={message.feedback} />
    </article>
  )
}
