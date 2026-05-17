import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ExamplePlayground } from "./playground/App"

describe("ExamplePlayground", () => {
  it("renders the four documented V1 scenarios", () => {
    render(<ExamplePlayground />)

    expect(screen.getByText("Simple assistant")).toBeInTheDocument()
    expect(screen.getByText("Tool-calling agent")).toBeInTheDocument()
    expect(screen.getByText("Reasoning + code artifact")).toBeInTheDocument()
    expect(screen.getByText("Custom renderer + adapter")).toBeInTheDocument()
  })
})
