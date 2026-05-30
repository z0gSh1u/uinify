import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { UiArtifactPart } from "../../src/model/types"
import { ArtifactContainer } from "../../src/react/artifact-container"
import { RenderersProvider } from "../../src/react/renderers"

function createPart(overrides?: Partial<UiArtifactPart["artifact"]>): UiArtifactPart {
  return {
    id: "artifact-1",
    kind: "artifact",
    artifact: {
      id: "artifact-code-1",
      kind: "code",
      title: "Build output",
      metadata: {
        path: "src/demo.ts",
        lines: 12,
      },
      defaultViewId: "preview",
      views: [
        {
          id: "source",
          label: "Source",
          kind: "source",
          language: "ts",
          value: "const answer = 42",
        },
        {
          id: "preview",
          label: "Preview",
          kind: "preview",
          value: "Rendered preview",
        },
      ],
      ...overrides,
    },
  }
}

describe("ArtifactContainer", () => {
  it("renders shared metadata and selects defaultViewId initially", () => {
    render(<ArtifactContainer part={createPart()} />)

    expect(screen.getByText("Build output")).toBeInTheDocument()
    expect(screen.getByText("path")).toBeInTheDocument()
    expect(screen.getByText("src/demo.ts")).toBeInTheDocument()
    expect(screen.getByText("lines")).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Preview" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText("Rendered preview")).toBeInTheDocument()
    expect(screen.queryByText("const answer = 42")).not.toBeInTheDocument()
  })

  it("switches between artifact views with buttons", async () => {
    const user = userEvent.setup()

    render(<ArtifactContainer part={createPart()} />)

    await user.click(screen.getByRole("button", { name: "Source" }))

    expect(screen.getByRole("button", { name: "Source" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText("const answer = 42")).toBeInTheDocument()
    expect(screen.queryByText("Rendered preview")).not.toBeInTheDocument()
  })

  it("uses renderer registry overrides keyed by artifact kind", () => {
    const part = createPart()
    const renderCodeArtifact = vi.fn(() => <div>Custom code artifact</div>)

    render(
      <RenderersProvider value={{ artifactRegistry: { code: renderCodeArtifact } }}>
        <ArtifactContainer part={part} />
      </RenderersProvider>,
    )

    expect(screen.getByText("Custom code artifact")).toBeInTheDocument()
    expect(renderCodeArtifact).toHaveBeenCalledTimes(1)
    expect(renderCodeArtifact).toHaveBeenCalledWith({
      artifact: part.artifact,
      part,
      view: part.artifact.views[1],
    })
  })

  it("uses renderArtifactFallback when no keyed renderer exists", () => {
    const part = createPart({ kind: "diagram" })
    const renderArtifactFallback = vi.fn(() => <div>Fallback artifact renderer</div>)

    render(
      <RenderersProvider value={{ renderArtifactFallback }}>
        <ArtifactContainer part={part} />
      </RenderersProvider>,
    )

    expect(screen.getByText("Fallback artifact renderer")).toBeInTheDocument()
    expect(renderArtifactFallback).toHaveBeenCalledTimes(1)
    expect(renderArtifactFallback).toHaveBeenCalledWith({
      artifact: part.artifact,
      part,
      view: part.artifact.views[1],
    })
  })

  it("prefers an artifact registry renderer over renderArtifactFallback", () => {
    const part = createPart()
    const renderCodeArtifact = vi.fn(() => <div>Registry artifact renderer</div>)
    const renderArtifactFallback = vi.fn(() => <div>Fallback artifact renderer</div>)

    render(
      <RenderersProvider
        value={{
          artifactRegistry: { code: renderCodeArtifact },
          renderArtifactFallback,
        }}
      >
        <ArtifactContainer part={part} />
      </RenderersProvider>,
    )

    expect(screen.getByText("Registry artifact renderer")).toBeInTheDocument()
    expect(renderCodeArtifact).toHaveBeenCalledTimes(1)
    expect(renderArtifactFallback).not.toHaveBeenCalled()
  })

  it("falls back to the first view when defaultViewId is unknown", () => {
    render(
      <ArtifactContainer
        part={createPart({
          defaultViewId: "missing-view",
        })}
      />,
    )

    expect(screen.getByRole("button", { name: "Source" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText("const answer = 42")).toBeInTheDocument()
    expect(screen.queryByText("Rendered preview")).not.toBeInTheDocument()
  })

  it("does not crash when views is empty", () => {
    expect(() =>
      render(
        <ArtifactContainer
          part={createPart({
            metadata: undefined,
            views: [],
          })}
        />,
      ),
    ).not.toThrow()

    expect(screen.getByText("Build output")).toBeInTheDocument()
    expect(screen.getByText("No artifact metadata.")).toBeInTheDocument()
    expect(screen.getByText("No artifact views are available.")).toBeInTheDocument()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
    expect(screen.queryByTestId("artifact-body")).not.toBeInTheDocument()
  })

  it("falls back to kind artifact heading and metadata empty copy", () => {
    render(
      <ArtifactContainer
        part={createPart({
          title: undefined,
          metadata: {},
        })}
      />,
    )

    expect(screen.getByText("code artifact")).toBeInTheDocument()
    expect(screen.getByText("No artifact metadata.")).toBeInTheDocument()
    expect(screen.queryByText("path")).not.toBeInTheDocument()
  })

  it("renders empty view copy when selected view content is empty", () => {
    render(
      <ArtifactContainer
        part={createPart({
          defaultViewId: "preview",
          views: [
            {
              id: "preview",
              label: "Preview",
              kind: "preview",
              value: "",
            },
          ],
        })}
      />,
    )

    expect(screen.getByRole("button", { name: "Preview" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText("This artifact view is empty.")).toBeInTheDocument()
    expect(screen.queryByText("Rendered preview")).not.toBeInTheDocument()
  })

  it("keeps artifact registry renderers for empty string views", () => {
    const part = createPart({
      defaultViewId: "preview",
      views: [
        {
          id: "preview",
          label: "Preview",
          kind: "preview",
          value: "",
        },
      ],
    })
    const renderCodeArtifact = vi.fn(() => <div>Custom empty artifact</div>)

    render(
      <RenderersProvider value={{ artifactRegistry: { code: renderCodeArtifact } }}>
        <ArtifactContainer part={part} />
      </RenderersProvider>,
    )

    expect(screen.getByText("Custom empty artifact")).toBeInTheDocument()
    expect(screen.queryByText("This artifact view is empty.")).not.toBeInTheDocument()
    expect(renderCodeArtifact).toHaveBeenCalledTimes(1)
    expect(renderCodeArtifact).toHaveBeenCalledWith({
      artifact: part.artifact,
      part,
      view: part.artifact.views[0],
    })
  })

  it("keeps renderArtifactFallback for empty string views", () => {
    const part = createPart({
      kind: "diagram",
      defaultViewId: "preview",
      views: [
        {
          id: "preview",
          label: "Preview",
          kind: "preview",
          value: "",
        },
      ],
    })
    const renderArtifactFallback = vi.fn(() => <div>Fallback empty artifact</div>)

    render(
      <RenderersProvider value={{ renderArtifactFallback }}>
        <ArtifactContainer part={part} />
      </RenderersProvider>,
    )

    expect(screen.getByText("Fallback empty artifact")).toBeInTheDocument()
    expect(screen.queryByText("This artifact view is empty.")).not.toBeInTheDocument()
    expect(renderArtifactFallback).toHaveBeenCalledTimes(1)
    expect(renderArtifactFallback).toHaveBeenCalledWith({
      artifact: part.artifact,
      part,
      view: part.artifact.views[0],
    })
  })

  it("renders code artifacts in a code block by default", () => {
    render(<ArtifactContainer part={createPart()} />)

    const container = screen.getByText("Build output").closest('[data-slot="artifact-container"]')

    expect(container?.querySelector('[data-slot="artifact-body"] pre code')?.textContent).toBe("Rendered preview")
  })

  it("renders text artifacts as readable plain text by default", () => {
    render(
      <ArtifactContainer
        part={createPart({
          kind: "text",
          defaultViewId: "plain-text",
          views: [
            {
              id: "plain-text",
              label: "Text",
              kind: "preview",
              value: "Line one\nLine two",
            },
          ],
        })}
      />,
    )

    const container = screen.getByText("Build output").closest('[data-slot="artifact-container"]')
    const body = container?.querySelector('[data-slot="artifact-body"]')

    expect(body?.textContent).toBe("Line one\nLine two")
    expect(body?.querySelector("pre")).toBeNull()
    expect(body?.querySelector('div')?.style.whiteSpace).toBe("pre-wrap")
  })

  it("formats json artifacts by default", () => {
    render(
      <ArtifactContainer
        part={createPart({
          kind: "json",
          defaultViewId: "json",
          views: [
            {
              id: "json",
              label: "JSON",
              kind: "preview",
              value: '{"title":"Demo","count":2}',
            },
          ],
        })}
      />,
    )

    const container = screen.getByText("Build output").closest('[data-slot="artifact-container"]')

    expect(container?.querySelector('[data-slot="artifact-body"] pre')?.textContent).toBe(
      '{\n  "title": "Demo",\n  "count": 2\n}',
    )
  })

  it("renders structured object views with the default body fallback", () => {
    render(
      <ArtifactContainer
        part={createPart({
          kind: "text",
          defaultViewId: "structured",
          views: [
            {
              id: "structured",
              label: "Structured",
              kind: "structured",
              value: { title: "Demo", count: 2 },
            },
          ],
        })}
      />,
    )

    expect(screen.getByRole("button", { name: "Structured" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText("Structured").closest('[data-slot="artifact-container"]')?.querySelector("pre")?.textContent).toBe(
      '{\n  "title": "Demo",\n  "count": 2\n}',
    )
  })

  it("resets selected view synchronously when the artifact payload changes under the same part id", async () => {
    const user = userEvent.setup()
    const initialPart = createPart()
    const renderCodeArtifact = vi.fn(({ view }) => <div>Custom code artifact: {view.id}</div>)
    const { rerender } = render(
      <RenderersProvider value={{ artifactRegistry: { code: renderCodeArtifact } }}>
        <ArtifactContainer part={initialPart} />
      </RenderersProvider>,
    )

    await user.click(screen.getByRole("button", { name: "Source" }))
    expect(screen.getByText("Custom code artifact: source")).toBeInTheDocument()
    expect(renderCodeArtifact).toHaveBeenLastCalledWith({
      artifact: initialPart.artifact,
      part: initialPart,
      view: initialPart.artifact.views[0],
    })
    renderCodeArtifact.mockClear()

    const nextPart: UiArtifactPart = {
      id: "artifact-1",
      kind: "artifact",
      artifact: {
        id: "artifact-code-2",
        kind: "code",
        title: "Build output",
        defaultViewId: "preview",
        views: [
          {
            id: "source",
            label: "Source",
            kind: "source",
            language: "ts",
            value: "const next = true",
          },
          {
            id: "preview",
            label: "Preview",
            kind: "preview",
            value: "Next rendered preview",
          },
        ],
      },
    }

    rerender(
      <RenderersProvider value={{ artifactRegistry: { code: renderCodeArtifact } }}>
        <ArtifactContainer part={nextPart} />
      </RenderersProvider>,
    )

    expect(renderCodeArtifact).toHaveBeenCalledTimes(1)
    expect(renderCodeArtifact).toHaveBeenCalledWith({
      artifact: nextPart.artifact,
      part: nextPart,
      view: nextPart.artifact.views[1],
    })
    expect(screen.getByRole("button", { name: "Preview" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText("Custom code artifact: preview")).toBeInTheDocument()
  })
})
