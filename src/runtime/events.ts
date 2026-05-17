import type { UiArtifact, UiMessageRole, UiToolCallPart } from "../model/types"

export type UiStreamEvent =
  | {
      type: "message.started"
      messageId: string
      role: UiMessageRole
    }
  | {
      type: "message.completed"
      messageId: string
    }
  | {
      type: "message.failed"
      messageId: string
      error: string
    }
  | {
      type: "part.text.delta"
      messageId: string
      partId: string
      delta: string
    }
  | {
      type: "part.reasoning.delta"
      messageId: string
      partId: string
      delta: string
    }
  | {
      type: "part.tool.updated"
      messageId: string
      partId: string
      toolName: string
      status: UiToolCallPart["status"]
      inputSummary?: string
      outputSummary?: string
    }
  | {
      type: "part.artifact.emitted"
      messageId: string
      partId: string
      artifact: UiArtifact
    }
