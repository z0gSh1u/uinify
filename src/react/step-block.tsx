import type { UiStepPart } from "../model/types"

export type StepBlockProps = {
  part: UiStepPart
}

export function StepBlock({ part }: StepBlockProps) {
  return (
    <section data-category={part.category} data-slot="step" data-state={part.status}>
      <header data-slot="step-header">
        <div data-slot="step-title">{part.label}</div>
        <div data-slot="step-badges">
          <span data-slot="step-category">{part.category}</span>
          <span data-slot="step-status">{part.status}</span>
        </div>
      </header>
      {part.summary ? <p data-slot="step-summary">{part.summary}</p> : null}
      {part.inputSummary ? (
        <div data-slot="step-input">
          <span data-slot="step-detail-label">Input</span>
          <p>{part.inputSummary}</p>
        </div>
      ) : null}
      {part.outputSummary ? (
        <div data-slot="step-output">
          <span data-slot="step-detail-label">Output</span>
          <p>{part.outputSummary}</p>
        </div>
      ) : null}
      {part.error ? <p data-slot="step-error">{part.error}</p> : null}
    </section>
  )
}
