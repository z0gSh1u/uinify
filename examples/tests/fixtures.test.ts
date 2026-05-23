import { describe, expect, it } from "vitest"
import { mapAgentLikeEvent } from "../adapters/agent-like"
import { customAgentLikeFixture } from "../adapters/protocol-fixtures"
import { exampleFixtureSections, exampleFixtures } from "../fixtures"

describe("exampleFixtures", () => {
  it("keeps examples/fixtures.ts as the documented metadata entrypoint", async () => {
    const module = await import("../fixtures")

    expect(module.exampleFixtureSections).toEqual(exampleFixtureSections)
  })

  it("derives ordered section metadata from the fixture taxonomy", () => {
    expect(exampleFixtureSections.map((section) => ({ title: section.title, ids: section.fixtures.map((fixture) => fixture.id) }))).toEqual([
      { title: "Getting started", ids: ["simple"] },
      { title: "Integration", ids: ["tool"] },
      { title: "Advanced", ids: ["artifact", "custom"] },
    ])
  })

  it("keeps the custom scenario assistant transcript as one mapped adapter source", () => {
    const customFixture = exampleFixtures.find((fixture) => fixture.id === "custom")

    expect(customFixture?.events.slice(3)).toEqual(customAgentLikeFixture.flatMap(mapAgentLikeEvent))
  })
})
