import { createAdapterRunner, type UiStreamEvent } from "../../src"

type CustomMinimalStartEvent = {
  kind: "begin"
  id: string
}

type CustomMinimalTextEvent = {
  kind: "text"
  id: string
  partId: string
  text: string
}

type CustomMinimalDoneEvent = {
  kind: "end"
  id: string
}

export type CustomMinimalEvent = CustomMinimalStartEvent | CustomMinimalTextEvent | CustomMinimalDoneEvent

export function mapCustomMinimalEvent(event: CustomMinimalEvent): UiStreamEvent[] {
  switch (event.kind) {
    case "begin":
      return [
        {
          type: "message.started",
          messageId: event.id,
          role: "assistant",
        },
      ]

    case "text":
      return [
        {
          type: "part.text.delta",
          messageId: event.id,
          partId: event.partId,
          delta: event.text,
        },
      ]

    case "end":
      return [
        {
          type: "message.completed",
          messageId: event.id,
        },
      ]
  }
}

export const adaptCustomMinimalEvent = createAdapterRunner(mapCustomMinimalEvent)
