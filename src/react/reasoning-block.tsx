import { useState } from "react"
import type { UiReasoningPart } from "../model/types"

export type ReasoningBlockProps = {
  part: UiReasoningPart
  onToggle?: (open: boolean) => void
}

export function ReasoningBlock({ part, onToggle }: ReasoningBlockProps) {
  const [open, setOpen] = useState(false)

  return (
    <section>
      <button
        aria-expanded={open}
        onClick={() => {
          const nextOpen = !open
          setOpen(nextOpen)
          onToggle?.(nextOpen)
        }}
        type="button"
      >
        {open ? "Hide reasoning" : "Show reasoning"}
      </button>
      <span>{part.state}</span>
      {open ? <div>{part.text}</div> : null}
    </section>
  )
}
