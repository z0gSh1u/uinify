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
  it("presents the playground as a documentation entrypoint", () => {
    render(<ExamplePlayground />)

    expect(screen.getByRole("heading", { level: 1, name: "Build chat UI with uinify" })).toBeInTheDocument()
    expect(screen.getByText("pnpm dev:example")).toBeInTheDocument()
    expect(screen.getByText("React-first chat UI foundation for backend-agnostic LLM apps.")).toBeInTheDocument()

    const checklist = screen.getByRole("region", { name: "Integration checklist" })
    expect(within(checklist).getByText("Install package")).toBeInTheDocument()
    expect(within(checklist).getByText("Import styles")).toBeInTheDocument()
    expect(within(checklist).getByText("Create runtime")).toBeInTheDocument()
    expect(within(checklist).getByText("Map events")).toBeInTheDocument()
    expect(within(checklist).getByText("Render UI")).toBeInTheDocument()

    const docsMap = screen.getByRole("navigation", { name: "Docs map" })
    expect(within(docsMap).getByRole("link", { name: "Getting Started" })).toHaveAttribute(
      "href",
      expect.stringContaining("getting-started"),
    )
    expect(within(docsMap).getByRole("link", { name: "Core Concepts" })).toHaveAttribute(
      "href",
      expect.stringContaining("core-concepts"),
    )
    expect(within(docsMap).getByRole("link", { name: "Stream Mapping" })).toHaveAttribute(
      "href",
      expect.stringContaining("stream-mapping"),
    )
    expect(within(docsMap).getByRole("link", { name: "SSE" })).toHaveAttribute(
      "href",
      expect.stringContaining("sse"),
    )
    expect(within(docsMap).getByRole("link", { name: "Composer" })).toHaveAttribute(
      "href",
      expect.stringContaining("composer-lexical"),
    )
    expect(within(docsMap).getByRole("link", { name: "Layered API" })).toHaveAttribute(
      "href",
      expect.stringContaining("layered-public-api"),
    )
    expect(within(docsMap).getByRole("link", { name: "Agent Steps" })).toHaveAttribute(
      "href",
      expect.stringContaining("agent-steps"),
    )
    expect(within(docsMap).getByRole("link", { name: "Styling" })).toHaveAttribute(
      "href",
      expect.stringContaining("theming"),
    )
  })

  it("shows one selected template preview at a time", async () => {
    const user = userEvent.setup()
    const minimalTemplate = exampleTemplates.find((template) => template.id === "minimal")
    const artifactTemplate = exampleTemplates.find((template) => template.id === "artifact")

    render(<ExamplePlayground />)

    const initialPreview = screen.getByRole("region", { name: "Selected template preview" })

    expect(screen.getByRole("button", { name: "Minimal app template" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getAllByRole("region", { name: "Selected template preview" })).toHaveLength(1)
    expect(minimalTemplate?.docsPath).toBe("docs/getting-started.md")
    expect(screen.getByRole("link", { name: "Read docs" })).toHaveAttribute("href", expect.stringContaining("getting-started"))
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
      expect.stringContaining("artifact-renderers"),
    )
    expect(screen.getByRole("link", { name: "Read docs" })).not.toHaveAttribute(
      "href",
      "docs/advanced/artifact-renderers.md",
    )
    expect(within(artifactPreview).getByText("const customized = true")).toBeInTheDocument()
    expect(within(artifactPreview).queryByRole("heading", { name: "Minimal app template" })).not.toBeInTheDocument()
    expect(screen.queryByText(/No adapter diagnostics for this transcript\./i)).not.toBeInTheDocument()
  })

  it("opens the layered agent showcase with a docs-backed link", async () => {
    const user = userEvent.setup()
    const showcaseTemplate = exampleTemplates.find((template) => template.id === "agent-showcase")

    render(<ExamplePlayground />)

    await user.click(screen.getByRole("button", { name: "Layered agent UI showcase" }))

    const showcasePreview = screen.getByRole("region", { name: "Selected template preview" })

    expect(screen.getByRole("button", { name: "Layered agent UI showcase" })).toHaveAttribute("aria-pressed", "true")
    expect(showcaseTemplate?.docsPath).toBe("docs/guides/layered-public-api.md")
    expect(screen.getByRole("link", { name: "Read docs" })).toHaveAttribute(
      "href",
      expect.stringContaining("layered-public-api"),
    )
    expect(within(showcasePreview).getByRole("heading", { level: 2, name: "Layered agent UI showcase" })).toBeInTheDocument()
    expect(within(showcasePreview).getByText("@researcher")).toBeInTheDocument()
    expect(within(showcasePreview).getByText("Submitted command payload")).toBeInTheDocument()
    expect(within(showcasePreview).getByText(/"id": "agent-research"/)).toBeInTheDocument()
    expect(within(showcasePreview).getByText("Selected command metadata: agent=researcher, mcp=browser.search")).toBeInTheDocument()
    expect(within(showcasePreview).getByRole("img", { name: "Uploaded product sketch" })).toBeInTheDocument()
    expect(within(showcasePreview).getByText("Inspect image")).toBeInTheDocument()
  })
})
