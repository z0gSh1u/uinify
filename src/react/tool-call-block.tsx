import type { UiToolCallPart } from "../model/types"

export type ToolCallBlockProps = {
  part: UiToolCallPart
}

export function ToolCallBlock({ part }: ToolCallBlockProps) {
  return (
    <section data-slot="toolcall" data-state={part.status}>
      <header>
        <strong>{part.toolName}</strong>
        <span>{part.status}</span>
      </header>
      {part.inputSummary ? <p>{part.inputSummary}</p> : null}
      {part.outputSummary ? <p>{part.outputSummary}</p> : null}
    </section>
  )
}
