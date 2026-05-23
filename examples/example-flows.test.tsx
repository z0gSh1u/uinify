import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ExamplePlayground } from "./playground/App"

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
  it("renders template-driven sections under the intended audience headings", () => {
    render(<ExamplePlayground />)

    const gettingStarted = screen.getByRole("heading", { name: "Getting started" }).closest("section")
    const integration = screen.getByRole("heading", { name: "Integration" }).closest("section")
    const advanced = screen.getByRole("heading", { name: "Advanced" }).closest("section")

    expect(gettingStarted).toBeTruthy()
    expect(integration).toBeTruthy()
    expect(advanced).toBeTruthy()

    expect(within(gettingStarted as HTMLElement).getByRole("heading", { level: 2, name: "Minimal app template" })).toBeTruthy()
    expect(within(integration as HTMLElement).getByRole("heading", { level: 2, name: "Adapter integration template" })).toBeTruthy()
    expect(within(integration as HTMLElement).getByRole("heading", { level: 2, name: "Upload orchestration template" })).toBeTruthy()
    expect(within(advanced as HTMLElement).getByRole("heading", { level: 2, name: "Artifact customization template" })).toBeTruthy()
  })

  it("surfaces docs-aligned template metadata in the playground", () => {
    render(<ExamplePlayground />)

    expect(screen.getByRole("link", { name: "Minimal app template" })).toHaveAttribute(
      "href",
      "docs/getting-started.md",
    )
    expect(screen.getByRole("link", { name: "Adapter integration template" })).toHaveAttribute(
      "href",
      "docs/integration/stream-mapping.md",
    )
    expect(screen.getByRole("link", { name: "Upload orchestration template" })).toHaveAttribute(
      "href",
      "docs/integration/upload-lifecycle.md",
    )
    expect(screen.getByRole("link", { name: "Artifact customization template" })).toHaveAttribute(
      "href",
      "docs/advanced/artifact-renderers.md",
    )
  })

  it("renders the template-specific example content instead of the old fixture scenarios", () => {
    render(<ExamplePlayground />)

    expect(screen.getAllByText(/Smallest copyable runtime plus transcript wiring/i)).toHaveLength(2)
    expect(screen.getByText(/No adapter diagnostics for this transcript\./i)).toBeInTheDocument()
    expect(screen.getByText("release-notes.pdf")).toBeInTheDocument()
    expect(screen.getByText("const customized = true")).toBeInTheDocument()
    expect(screen.queryByText("Starter chat flow")).not.toBeInTheDocument()
  })
})
