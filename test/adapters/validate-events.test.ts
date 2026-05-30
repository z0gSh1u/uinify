import { describe, expect, expectTypeOf, it } from "vitest"
import {
  createAdapterRunner,
  createAdapterResult,
  type UiAdapterDiagnostic,
  type UiAdapterResult,
  type UiStreamEvent,
  validateAdapterEvents,
} from "../../src/index"

describe("adapter validation", () => {
  it("creates stable adapter results with optional diagnostics", () => {
    const events: UiStreamEvent[] = [
      {
        type: "message.started",
        messageId: "m1",
        role: "assistant",
      },
    ]
    const diagnostics: UiAdapterDiagnostic[] = [
      {
        level: "warning",
        code: "empty-output",
        message: "Adapter produced no events.",
      },
    ]

    expect(createAdapterResult(events)).toEqual({ events, diagnostics: [] })
    expect(createAdapterResult(events, diagnostics)).toEqual({ events, diagnostics })

    expectTypeOf<UiAdapterDiagnostic>().toMatchTypeOf<{
      level: "warning" | "error"
      code: "empty-output" | "missing-message-start" | "invalid-artifact"
      message: string
    }>()
    expectTypeOf<UiAdapterResult>().toMatchTypeOf<{
      events: UiStreamEvent[]
      diagnostics: UiAdapterDiagnostic[]
    }>()
  })

  it("warns when the adapter outputs no events", () => {
    expect(validateAdapterEvents([])).toEqual([
      {
        level: "warning",
        code: "empty-output",
        message: "Adapter produced no events.",
      },
    ])
  })

  it("warns when completion-like events arrive before message.started", () => {
    const diagnostics = validateAdapterEvents([
      {
        type: "part.text.delta",
        messageId: "missing",
        partId: "p1",
        delta: "hello",
      },
      {
        type: "message.completed",
        messageId: "missing",
      },
      {
        type: "message.failed",
        messageId: "missing",
        error: "boom",
      },
    ])

    expect(diagnostics).toEqual([
      {
        level: "warning",
        code: "missing-message-start",
        message: 'Event "part.text.delta" arrived before "message.started" for message "missing".',
      },
      {
        level: "warning",
        code: "missing-message-start",
        message: 'Event "message.completed" arrived before "message.started" for message "missing".',
      },
      {
        level: "warning",
        code: "missing-message-start",
        message: 'Event "message.failed" arrived before "message.started" for message "missing".',
      },
    ])
  })

  it("warns when step events arrive before message.started", () => {
    const diagnostics = validateAdapterEvents([
      {
        type: "part.step.started",
        messageId: "missing",
        partId: "step-1",
        category: "tool",
        label: "Search docs",
      },
      {
        type: "part.step.completed",
        messageId: "missing",
        partId: "step-1",
        outputSummary: "done",
      },
      {
        type: "part.step.failed",
        messageId: "missing",
        partId: "step-2",
        error: "boom",
      },
    ])

    expect(diagnostics).toEqual([
      {
        level: "warning",
        code: "missing-message-start",
        message: 'Event "part.step.started" arrived before "message.started" for message "missing".',
      },
      {
        level: "warning",
        code: "missing-message-start",
        message: 'Event "part.step.completed" arrived before "message.started" for message "missing".',
      },
      {
        level: "warning",
        code: "missing-message-start",
        message: 'Event "part.step.failed" arrived before "message.started" for message "missing".',
      },
    ])
  })

  it("warns when step completion or failure arrives before step start or update", () => {
    const diagnostics = validateAdapterEvents([
      {
        type: "message.started",
        messageId: "m1",
        role: "assistant",
      },
      {
        type: "part.step.completed",
        messageId: "m1",
        partId: "step-1",
        outputSummary: "done",
      },
      {
        type: "part.step.failed",
        messageId: "m1",
        partId: "step-2",
        error: "boom",
      },
    ])

    expect(diagnostics).toEqual([
      {
        level: "warning",
        code: "invalid-artifact",
        message: 'Step "step-1" completed or failed before it was started or updated for message "m1".',
      },
      {
        level: "warning",
        code: "invalid-artifact",
        message: 'Step "step-2" completed or failed before it was started or updated for message "m1".',
      },
    ])
  })

  it("does not reuse known step keys after a message completes", () => {
    const run = createAdapterRunner((events: UiStreamEvent[]) => events)

    expect(
      run([
        {
          type: "message.started",
          messageId: "m1",
          role: "assistant",
        },
        {
          type: "part.step.started",
          messageId: "m1",
          partId: "step-1",
          category: "tool",
          label: "Search docs",
        },
      ]).diagnostics,
    ).toEqual([])
    expect(
      run([
        {
          type: "message.completed",
          messageId: "m1",
        },
      ]).diagnostics,
    ).toEqual([])

    expect(
      run([
        {
          type: "message.started",
          messageId: "m1",
          role: "assistant",
        },
        {
          type: "part.step.completed",
          messageId: "m1",
          partId: "step-1",
          outputSummary: "done",
        },
      ]).diagnostics,
    ).toEqual([
      {
        level: "warning",
        code: "invalid-artifact",
        message: 'Step "step-1" completed or failed before it was started or updated for message "m1".',
      },
    ])
  })

  it("warns when an emitted artifact has no views", () => {
    const diagnostics = validateAdapterEvents([
      {
        type: "message.started",
        messageId: "m1",
        role: "assistant",
      },
      {
        type: "part.artifact.emitted",
        messageId: "m1",
        partId: "artifact-1",
        artifact: {
          id: "artifact-1",
          kind: "code",
          views: [],
        },
      },
    ])

    expect(diagnostics).toEqual([
      {
        level: "warning",
        code: "invalid-artifact",
        message: 'Artifact "artifact-1" must include at least one view.',
      },
    ])
  })

  it("warns when an emitted image has no URL", () => {
    const diagnostics = validateAdapterEvents([
      {
        type: "message.started",
        messageId: "m1",
        role: "user",
      },
      {
        type: "part.image.emitted",
        messageId: "m1",
        partId: "image-1",
        image: {
          url: "",
          alt: "missing URL",
        },
      },
    ])

    expect(diagnostics).toEqual([
      {
        level: "warning",
        code: "invalid-artifact",
        message: 'Image "image-1" must include a URL.',
      },
    ])
  })

  it("returns no diagnostics for valid canonical events", () => {
    expect(
      validateAdapterEvents([
        {
          type: "message.started",
          messageId: "m1",
          role: "assistant",
        },
        {
          type: "part.text.delta",
          messageId: "m1",
          partId: "p1",
          delta: "hello",
        },
        {
          type: "part.artifact.emitted",
          messageId: "m1",
          partId: "artifact-1",
          artifact: {
            id: "artifact-1",
            kind: "code",
            views: [
              {
                id: "source",
                label: "Source",
                kind: "source",
                value: "console.log('hi')",
              },
            ],
          },
        },
        {
          type: "part.step.started",
          messageId: "m1",
          partId: "step-1",
          category: "tool",
          label: "Search docs",
        },
        {
          type: "part.step.completed",
          messageId: "m1",
          partId: "step-1",
          outputSummary: "Found docs",
        },
        {
          type: "part.image.emitted",
          messageId: "m1",
          partId: "image-1",
          image: {
            url: "https://example.com/image.png",
            alt: "Example image",
          },
        },
        {
          type: "message.completed",
          messageId: "m1",
        },
      ]),
    ).toEqual([])
  })
})
