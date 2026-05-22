import type { UiStreamEvent } from "../runtime/events"

export type UiAdapterDiagnosticCode =
  | "empty-output"
  | "missing-message-start"
  | "invalid-artifact"

export type UiAdapterDiagnostic = {
  level: "warning" | "error"
  code: UiAdapterDiagnosticCode
  message: string
}

export type UiAdapterResult = {
  events: UiStreamEvent[]
  diagnostics: UiAdapterDiagnostic[]
}

export function createAdapterResult(
  events: UiStreamEvent[],
  diagnostics: UiAdapterDiagnostic[] = [],
): UiAdapterResult {
  return { events, diagnostics }
}
