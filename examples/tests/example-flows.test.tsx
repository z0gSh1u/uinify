import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { exampleTemplates } from "../fixtures"
import { ExamplePlayground } from "../playground/App"

vi.mock("react-virtuoso", () => ({
  Virtuoso: ({
    data,
    itemContent,
  }: {
    data: unknown[]
    itemContent: (index: number, item?: unknown) => React.ReactNode
  }) => (
    <div>
      {data.map((item, index) => (
        <div key={index}>{itemContent(index, item)}</div>
      ))}
    </div>
  ),
}))

describe("ExamplePlayground", () => {
  it("shows one selected template preview at a time", async () => {
    const user = userEvent.setup()
    const minimalTemplate = exampleTemplates.find((template) => template.id === "minimal")
    const artifactTemplate = exampleTemplates.find((template) => template.id === "artifact")

    render(<ExamplePlayground />)

    const initialPreview = screen.getByRole("region", { name: "Selected template preview" })

    expect(screen.getByRole("button", { name: "Minimal app template" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getAllByRole("region", { name: "Selected template preview" })).toHaveLength(1)
    expect(minimalTemplate?.docsPath).toBe("docs/getting-started.md")
    expect(screen.getByRole("link", { name: "Read docs" })).toHaveAttribute("href", expect.stringContaining("getting-started.md"))
    expect(screen.getByRole("link", { name: "Read docs" })).not.toHaveAttribute("href", "docs/getting-started.md")
    expect(initialPreview).toHaveTextContent("Minimal app template")
    expect(within(initialPreview).queryByText("const customized = true")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Artifact customization template" }))

    const artifactPreview = screen.getByRole("region", { name: "Selected template preview" })

    expect(screen.getByRole("button", { name: "Artifact customization template" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Minimal app template" })).toHaveAttribute("aria-pressed", "false")
    expect(screen.getAllByRole("region", { name: "Selected template preview" })).toHaveLength(1)
    expect(artifactTemplate?.docsPath).toBe("docs/advanced/artifact-renderers.md")
    expect(screen.getByRole("link", { name: "Read docs" })).toHaveAttribute(
      "href",
      expect.stringContaining("artifact-renderers.md"),
    )
    expect(screen.getByRole("link", { name: "Read docs" })).not.toHaveAttribute(
      "href",
      "docs/advanced/artifact-renderers.md",
    )
    expect(within(artifactPreview).getByText("const customized = true")).toBeInTheDocument()
    expect(within(artifactPreview).queryByRole("heading", { name: "Minimal app template" })).not.toBeInTheDocument()
    expect(screen.queryByText(/No adapter diagnostics for this transcript\./i)).not.toBeInTheDocument()
  })
})
