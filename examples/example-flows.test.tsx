import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { exampleFixtures } from "./fixtures"
import { ExamplePlayground } from "./playground/App"

describe("ExamplePlayground", () => {
  it("renders the four documented V1 scenarios", () => {
    render(<ExamplePlayground />)

    expect(screen.getByText("Simple assistant")).toBeInTheDocument()
    expect(screen.getByText("Tool-calling agent")).toBeInTheDocument()
    expect(screen.getByText("Reasoning + code artifact")).toBeInTheDocument()
    expect(screen.getByText("Custom renderer + adapter")).toBeInTheDocument()
  })

  it("uses a code artifact for the custom renderer scenario", () => {
    const customFixture = exampleFixtures.find((fixture) => fixture.id === "custom")
    const artifactEvent = customFixture?.events.find((event) => event.type === "part.artifact.emitted")

    expect(artifactEvent && artifactEvent.type === "part.artifact.emitted" ? artifactEvent.artifact.kind : null).toBe("code")
  })
})
