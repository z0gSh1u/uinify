import type { UiArtifact, UiAttachment, UiImagePart, UiMessageRole, UiStepCategory, UiStepPart } from "../model/types"

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
      type: "part.step.started"
      messageId: string
      partId: string
      category: UiStepCategory
      label: string
      summary?: string
      inputSummary?: string
      startedAt?: string
      metadata?: Record<string, unknown>
    }
  | {
      type: "part.step.updated"
      messageId: string
      partId: string
      category?: UiStepCategory
      status?: UiStepPart["status"]
      label?: string
      summary?: string
      inputSummary?: string
      outputSummary?: string
      error?: string
      startedAt?: string
      completedAt?: string
      metadata?: Record<string, unknown>
    }
  | {
      type: "part.step.completed"
      messageId: string
      partId: string
      category?: UiStepCategory
      label?: string
      summary?: string
      inputSummary?: string
      outputSummary?: string
      completedAt?: string
      metadata?: Record<string, unknown>
    }
  | {
      type: "part.step.failed"
      messageId: string
      partId: string
      category?: UiStepCategory
      label?: string
      summary?: string
      inputSummary?: string
      outputSummary?: string
      error: string
      completedAt?: string
      metadata?: Record<string, unknown>
    }
  | {
      type: "part.image.emitted"
      messageId: string
      partId: string
      image: Omit<UiImagePart, "id" | "kind">
    }
  | {
      type: "part.artifact.emitted"
      messageId: string
      partId: string
      artifact: UiArtifact
    }
  | {
      type: "part.attachment.updated"
      messageId: string
      partId: string
      attachment: UiAttachment
    }
