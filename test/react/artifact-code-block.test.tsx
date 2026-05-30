import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { renderDefaultArtifactBody } from "../../src/react/artifact-body"
import { ArtifactCodeBlock } from "../../src/react/artifact-code-block"

describe("ArtifactCodeBlock", () => {
  it("selects the view identified by defaultViewId", () => {
    render(
      <ArtifactCodeBlock
        part={{
          id: "artifact-default-view",
          kind: "artifact",
          artifact: {
            id: "artifact-default-view-1",
            kind: "code",
            defaultViewId: "preview",
            views: [
              {
                id: "source",
                label: "Source",
                kind: "source",
                language: "ts",
                value: "const hidden = true",
              },
              {
                id: "preview",
                label: "Preview",
                kind: "preview",
                value: "Rendered preview",
              },
            ],
          },
        }}
      />,
    )

    expect(screen.getByText("Preview")).toBeInTheDocument()
    expect(screen.getByText("Rendered preview")).toBeInTheDocument()
    expect(screen.queryByText("const hidden = true")).not.toBeInTheDocument()
  })

  it("renders a structured object view without crashing", () => {
    expect(() =>
      render(
        <ArtifactCodeBlock
          part={{
            id: "artifact-structured-view",
            kind: "artifact",
            artifact: {
              id: "artifact-structured-view-1",
              kind: "text",
              views: [
                {
                  id: "structured",
                  label: "Structured",
                  kind: "structured",
                  value: { title: "Demo", count: 2 },
                },
              ],
            },
          }}
        />,
      ),
    ).not.toThrow()

    expect(screen.getByText("Structured")).toBeInTheDocument()
    expect(screen.getByText("Structured").closest("section")?.querySelector("pre")?.textContent).toBe(
      '{\n  "title": "Demo",\n  "count": 2\n}',
    )
  })

  it("renders fallback text when JSON serialization throws", () => {
    const circularValue: Record<string, unknown> = { title: "Demo" }
    circularValue.self = circularValue

    expect(() =>
      render(
        <ArtifactCodeBlock
          part={{
            id: "artifact-circular-view",
            kind: "artifact",
            artifact: {
              id: "artifact-circular-view-1",
              kind: "text",
              views: [
                {
                  id: "structured",
                  label: "Structured",
                  kind: "structured",
                  value: circularValue,
                },
              ],
            },
          }}
        />,
      ),
    ).not.toThrow()

    expect(screen.getByText("Structured")).toBeInTheDocument()
    expect(screen.getByText("[structured artifact view unavailable]")).toBeInTheDocument()
  })

  it("keeps renderDefaultArtifactBody compatible with legacy callers that pass only view", () => {
    expect(() =>
      render(
        <>{
          renderDefaultArtifactBody({
            view: {
              id: "source",
              label: "Source",
              kind: "source",
              language: "ts",
              value: "const legacy = true",
            },
          })
        }</>,
      ),
    ).not.toThrow()

    expect(screen.getByText("const legacy = true").closest("code")).toBeTruthy()
  })
})
