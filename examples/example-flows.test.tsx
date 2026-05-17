import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { exampleFixtures } from "./fixtures"
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
  it("renders grouped v0.2 example sections with scenarios under the intended headings", () => {
    render(<ExamplePlayground />)

    const gettingStarted = screen.getByRole("heading", { name: "Getting started" }).closest("section")
    const integration = screen.getByRole("heading", { name: "Integration" }).closest("section")
    const advanced = screen.getByRole("heading", { name: "Advanced" }).closest("section")

    expect(gettingStarted).toContainElement(screen.getByRole("heading", { name: "Starter chat flow" }))
    expect(integration).toContainElement(screen.getByRole("heading", { name: "Integration mapper flow" }))
    expect(advanced).toContainElement(screen.getByRole("heading", { name: "Upload lifecycle flow" }))
    expect(advanced).toContainElement(screen.getByRole("heading", { name: "Artifact registry customization" }))
  })

  it("shows the custom scenario through the artifact registry override path", () => {
    render(<ExamplePlayground />)

    expect(screen.getByText(/Artifact registry override \(json\):/i)).toBeInTheDocument()
    expect(screen.queryByText(/Custom tool:/i)).not.toBeInTheDocument()
  })

  it("shows the custom scenario safely rendering structured artifact values", () => {
    render(<ExamplePlayground />)

    expect(screen.getByRole("button", { name: "JSON" }).closest('[data-slot="artifact-container"]')?.querySelector("pre")?.textContent).toBe(
      '{\n  "adapter": "host-event",\n  "dispatched": true\n}',
    )
    expect(screen.queryByText("[structured artifact view unavailable]")).not.toBeInTheDocument()
  })
})
