import { useState } from "react"
import type { UiToolCallPart } from "../model/types"

export type ToolCallBlockProps = {
  part: UiToolCallPart
  onToggleDetails?: (open: boolean) => void
}

export function ToolCallBlock({ part, onToggleDetails }: ToolCallBlockProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <section>
      <header>
        <strong>{part.toolName}</strong>
        <span>{part.status}</span>
        <button
          aria-expanded={detailsOpen}
          onClick={() => {
            const nextOpen = !detailsOpen
            setDetailsOpen(nextOpen)
            onToggleDetails?.(nextOpen)
          }}
          type="button"
        >
          {detailsOpen ? "Hide tool details" : "Show tool details"}
        </button>
      </header>
      {detailsOpen && part.inputSummary ? <p>{part.inputSummary}</p> : null}
      {detailsOpen && part.outputSummary ? <p>{part.outputSummary}</p> : null}
    </section>
  )
}
