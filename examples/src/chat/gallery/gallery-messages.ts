import { createChatRuntime, type UiStreamEvent } from "../../../../src"
import type { UiArtifact, UiMessage } from "../../../../src/model/types"

export const SURFACE_GALLERY_CONVERSATION_ID = "surface-gallery"
export const SURFACE_GALLERY_USER_MESSAGE_ID = "user-gallery-message"
export const SURFACE_GALLERY_ASSISTANT_MESSAGE_ID = "assistant-gallery-message"

export const SURFACE_GALLERY_IMAGE_URL =
  "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20640%20360%22%20role%3D%22img%22%3E%3Crect%20width%3D%22640%22%20height%3D%22360%22%20rx%3D%2228%22%20fill%3D%22%230f172a%22%2F%3E%3Crect%20x%3D%2248%22%20y%3D%2252%22%20width%3D%22544%22%20height%3D%22256%22%20rx%3D%2220%22%20fill%3D%22%23f8fafc%22%2F%3E%3Ccircle%20cx%3D%2292%22%20cy%3D%2292%22%20r%3D%2218%22%20fill%3D%22%2314b8a6%22%2F%3E%3Crect%20x%3D%22128%22%20y%3D%2278%22%20width%3D%22244%22%20height%3D%2220%22%20rx%3D%2210%22%20fill%3D%22%230f172a%22%2F%3E%3Crect%20x%3D%2292%22%20y%3D%22134%22%20width%3D%22456%22%20height%3D%2228%22%20rx%3D%2214%22%20fill%3D%22%23dbeafe%22%2F%3E%3Crect%20x%3D%2292%22%20y%3D%22182%22%20width%3D%22384%22%20height%3D%2228%22%20rx%3D%2214%22%20fill%3D%22%23dcfce7%22%2F%3E%3Crect%20x%3D%2292%22%20y%3D%22230%22%20width%3D%22420%22%20height%3D%2228%22%20rx%3D%2214%22%20fill%3D%22%23fee2e2%22%2F%3E%3C%2Fsvg%3E"

export const SURFACE_GALLERY_ARTIFACT: UiArtifact = {
  id: "surface-gallery-artifact",
  kind: "gallery",
  title: "Surface gallery bundle",
  defaultViewId: "summary",
  metadata: {
    deterministic: true,
    surfaces: 7,
    source: "fixture",
  },
  views: [
    {
      id: "summary",
      label: "Summary",
      kind: "preview",
      value:
        "Preview surface tabs, attachment states, reasoning disclosure, tool steps, images, and host actions in one transcript.",
    },
    {
      id: "json",
      label: "JSON",
      kind: "structured",
      value: {
        transcript: "surface-gallery",
        surfaces: ["attachments", "reasoning", "steps", "image", "artifact", "actions"],
        deterministic: true,
      },
    },
    {
      id: "source",
      label: "Source",
      kind: "source",
      language: "ts",
      value: `export const galleryFixture = {
  id: "surface-gallery",
  runtime: "uinify",
  deterministic: true,
}`,
    },
  ],
}

export const SURFACE_GALLERY_EVENTS: UiStreamEvent[] = [
  {
    type: "message.started",
    messageId: SURFACE_GALLERY_USER_MESSAGE_ID,
    role: "user",
  },
  {
    type: "part.text.delta",
    messageId: SURFACE_GALLERY_USER_MESSAGE_ID,
    partId: "user-gallery-text",
    delta:
      "Please review these uploaded images and show every UI surface in one deterministic chat transcript.",
  },
  {
    type: "part.attachment.updated",
    messageId: SURFACE_GALLERY_USER_MESSAGE_ID,
    partId: "user-uploaded-reference",
    attachment: {
      id: "uploaded-reference",
      name: "uploaded-reference.png",
      mimeType: "image/png",
      size: 184320,
      status: "uploaded",
      remoteUrl: "https://example.invalid/uploads/uploaded-reference.png",
    },
  },
  {
    type: "part.attachment.updated",
    messageId: SURFACE_GALLERY_USER_MESSAGE_ID,
    partId: "user-uploading-wireframe",
    attachment: {
      id: "uploading-wireframe",
      name: "uploading-wireframe.jpg",
      mimeType: "image/jpeg",
      size: 245760,
      status: "uploading",
      progress: 67,
    },
  },
  {
    type: "part.attachment.updated",
    messageId: SURFACE_GALLERY_USER_MESSAGE_ID,
    partId: "user-rejected-large-image",
    attachment: {
      id: "rejected-large-image",
      name: "rejected-large-image.gif",
      mimeType: "image/gif",
      size: 7340032,
      status: "error",
      rejection: {
        code: "invalid-type",
        message: "Animated GIFs are not supported in this gallery.",
      },
    },
  },
  {
    type: "message.completed",
    messageId: SURFACE_GALLERY_USER_MESSAGE_ID,
  },
  {
    type: "message.started",
    messageId: SURFACE_GALLERY_ASSISTANT_MESSAGE_ID,
    role: "assistant",
  },
  {
    type: "part.text.delta",
    messageId: SURFACE_GALLERY_ASSISTANT_MESSAGE_ID,
    partId: "assistant-gallery-text",
    delta:
      "This deterministic answer exercises the chat surface without contacting the live chat API.",
  },
  {
    type: "part.reasoning.delta",
    messageId: SURFACE_GALLERY_ASSISTANT_MESSAGE_ID,
    partId: "assistant-gallery-reasoning",
    delta:
      "Reasoning trace: inspect each fixture part, keep the transcript deterministic, and surface controls that a live model may not trigger on demand.",
  },
  {
    type: "part.step.started",
    messageId: SURFACE_GALLERY_ASSISTANT_MESSAGE_ID,
    partId: "assistant-gallery-tool-step",
    category: "tool",
    label: "Tool: image metadata lookup",
    summary: "Running image metadata inspection.",
    inputSummary: "3 image attachment states",
    startedAt: "2026-06-13T00:00:00.000Z",
  },
  {
    type: "part.step.started",
    messageId: SURFACE_GALLERY_ASSISTANT_MESSAGE_ID,
    partId: "assistant-gallery-planner-step",
    category: "planner",
    label: "Planner: compose response outline",
    summary: "Plan the deterministic showcase response.",
    inputSummary: "gallery requirements",
    startedAt: "2026-06-13T00:00:01.000Z",
  },
  {
    type: "part.step.completed",
    messageId: SURFACE_GALLERY_ASSISTANT_MESSAGE_ID,
    partId: "assistant-gallery-planner-step",
    outputSummary: "Reasoning, steps, image, artifact, attachment, and action surfaces included.",
    completedAt: "2026-06-13T00:00:02.000Z",
  },
  {
    type: "part.step.started",
    messageId: SURFACE_GALLERY_ASSISTANT_MESSAGE_ID,
    partId: "assistant-gallery-workflow-step",
    category: "workflow",
    label: "Workflow: publish gallery artifact",
    summary: "Attempt to publish a gallery artifact.",
    inputSummary: "Surface gallery bundle",
    startedAt: "2026-06-13T00:00:03.000Z",
  },
  {
    type: "part.step.failed",
    messageId: SURFACE_GALLERY_ASSISTANT_MESSAGE_ID,
    partId: "assistant-gallery-workflow-step",
    error: "Publishing is disabled for deterministic fixtures.",
    completedAt: "2026-06-13T00:00:04.000Z",
  },
  {
    type: "part.image.emitted",
    messageId: SURFACE_GALLERY_ASSISTANT_MESSAGE_ID,
    partId: "assistant-gallery-image",
    image: {
      url: SURFACE_GALLERY_IMAGE_URL,
      alt: "Inline preview of a gallery card",
      mimeType: "image/svg+xml",
      width: 640,
      height: 360,
    },
  },
  {
    type: "part.artifact.emitted",
    messageId: SURFACE_GALLERY_ASSISTANT_MESSAGE_ID,
    partId: "assistant-gallery-artifact",
    artifact: SURFACE_GALLERY_ARTIFACT,
  },
  {
    type: "message.completed",
    messageId: SURFACE_GALLERY_ASSISTANT_MESSAGE_ID,
  },
]

export function createSurfaceGalleryRuntime() {
  const runtime = createChatRuntime({ conversationId: SURFACE_GALLERY_CONVERSATION_ID })

  for (const event of SURFACE_GALLERY_EVENTS) {
    runtime.dispatch(event)
  }

  return runtime
}

export function createSurfaceGalleryMessages(): UiMessage[] {
  return createSurfaceGalleryRuntime().getState().messages
}
