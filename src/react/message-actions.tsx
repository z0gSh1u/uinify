import type { UiMessage } from "../model/types"
import { getAvailableMessageActions } from "./actions"
import { useChatActionHandlers } from "./chat-root"

export type MessageActionsProps = {
  message: UiMessage
}

export function MessageActions({ message }: MessageActionsProps) {
  const actions = getAvailableMessageActions(message)
  const { onMessageAction } = useChatActionHandlers()

  if (!onMessageAction || actions.length === 0) {
    return null
  }

  return (
    <div aria-label="Message actions" data-slot="message-actions" role="group">
      {actions.map((action) => (
        <button
          aria-label={`${action.label} message`}
          key={action.id}
          onClick={() =>
            onMessageAction?.({
              action: action.id,
              messageId: message.id,
              role: message.role,
            })
          }
          type="button"
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
