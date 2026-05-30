import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { StepBlock } from "../../src/react/step-block"

describe("StepBlock", () => {
  it("renders step category, status, label, and summaries", () => {
    render(
      <StepBlock
        part={{
          id: "step-1",
          kind: "step",
          category: "tool",
          status: "running",
          label: "Search docs",
          summary: "Looking up integration docs",
          inputSummary: "query: SSE support",
          outputSummary: "2 candidate pages",
        }}
      />,
    )

    expect(screen.getByText("Search docs")).toBeInTheDocument()
    expect(screen.getByText("tool")).toBeInTheDocument()
    expect(screen.getByText("running")).toBeInTheDocument()
    expect(screen.getByText("Looking up integration docs")).toBeInTheDocument()
    expect(screen.getByText("Input")).toBeInTheDocument()
    expect(screen.getByText("query: SSE support")).toBeInTheDocument()
    expect(screen.getByText("Output")).toBeInTheDocument()
    expect(screen.getByText("2 candidate pages")).toBeInTheDocument()
  })

  it("renders error details and stable slot attributes", () => {
    const { container } = render(
      <StepBlock
        part={{
          id: "step-error",
          kind: "step",
          category: "retrieval",
          status: "error",
          label: "Fetch knowledge base",
          error: "Search backend unavailable",
        }}
      />,
    )

    expect(screen.getByText("Fetch knowledge base")).toBeInTheDocument()
    expect(screen.getByText("retrieval")).toBeInTheDocument()
    expect(screen.getByText("error")).toBeInTheDocument()
    expect(screen.getByText("Search backend unavailable")).toBeInTheDocument()
    expect(container.querySelector('[data-slot="step"]')).toHaveAttribute("data-state", "error")
    expect(container.querySelector('[data-slot="step"]')).toHaveAttribute("data-category", "retrieval")
    expect(container.querySelector('[data-slot="step-error"]')).toBeInTheDocument()
  })
})
