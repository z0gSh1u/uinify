import { describe, expect, it } from "vitest"
import { mapAgentLikeEvent } from "../adapters/agent-like"
import { customAgentLikeFixture } from "../adapters/protocol-fixtures"
import { exampleFixtureSections, exampleFixtures, exampleTemplateSections, exampleTemplates } from "../fixtures"

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

  it("includes the multimodal image template in integration metadata", () => {
    const integrationTemplates = exampleTemplateSections.find((section) => section.id === "integration")

    expect(integrationTemplates?.templates.map((template) => template.id)).toEqual([
      "adapter",
      "multimodal",
      "upload",
      "agent-showcase",
    ])
    expect(integrationTemplates?.templates.find((template) => template.id === "multimodal")).toEqual(
      expect.objectContaining({
        title: "Multimodal image template",
        docsPath: "docs/integration/multimodal-images.md",
      }),
    )
  })

  it("derives ordered template section metadata including the v0.4 showcase", () => {
    expect(exampleTemplateSections.map((section) => ({ title: section.title, ids: section.templates.map((template) => template.id) }))).toEqual([
      { title: "Getting started", ids: ["minimal"] },
      { title: "Integration", ids: ["adapter", "multimodal", "upload", "agent-showcase"] },
      { title: "Advanced", ids: ["artifact"] },
    ])
  })

  it("keeps the v0.4 agent showcase aligned with layered API docs", () => {
    expect(exampleTemplates.find((template) => template.id === "agent-showcase")).toEqual({
      id: "agent-showcase",
      category: "integration",
      title: "Layered agent UI showcase",
      description: "Commands, image input, and agent steps composed through public contracts.",
      docsPath: "docs/guides/layered-public-api.md",
    })
  })
})
