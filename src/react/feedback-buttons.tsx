import type { UiMessage } from "../model/types"

export type FeedbackButtonsProps = {
  value?: UiMessage["feedback"]
  onSelect?: (value: Exclude<UiMessage["feedback"], "none">) => void
}

export function FeedbackButtons({ value = "none", onSelect }: FeedbackButtonsProps) {
  return (
    <div aria-label="Message feedback" role="group">
      <button
        aria-label="Thumbs up"
        aria-pressed={value === "up"}
        onClick={() => onSelect?.("up")}
        type="button"
      >
        Up
      </button>
      <button
        aria-label="Thumbs down"
        aria-pressed={value === "down"}
        onClick={() => onSelect?.("down")}
        type="button"
      >
        Down
      </button>
    </div>
  )
}
