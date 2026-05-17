import { useState } from "react"
import type { UiReasoningPart } from "../model/types"

export type ReasoningBlockProps = {
  part: UiReasoningPart
}

export function ReasoningBlock({ part }: ReasoningBlockProps) {
  const [open, setOpen] = useState(false)

  return (
    <section>
      <button
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {open ? "Hide reasoning" : "Show reasoning"}
      </button>
      <span>{part.state}</span>
      {open ? <div>{part.text}</div> : null}
    </section>
  )
}
