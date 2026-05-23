/* @vitest-environment node */

import { existsSync } from "node:fs"
import { readFile, stat } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..")

const requiredDocs = [
  { path: "docs/guides/core-concepts.md", heading: "# Core Concepts" },
  { path: "docs/guides/examples.md", heading: "# Examples" },
  { path: "docs/integration/sse.md", heading: "# SSE Integration" },
  { path: "docs/components/message-list.md", heading: "# Message List" },
  { path: "docs/components/composer-lexical.md", heading: "# Lexical Composer" },
  { path: "docs/styling/theming.md", heading: "# Theming" },
  { path: "docs/styling/slots.md", heading: "# Stable Slots" },
] as const

const planningSpecs = [
  "2026-05-17-uinify-chat-ui-library-design.md",
  "2026-05-22-uinify-v0.3-example-app-templates-design.md",
] as const

const planningPlans = [
  "2026-05-17-uinify-v1-implementation.md",
  "2026-05-22-uinify-v0.3-example-app-templates.md",
] as const

describe("repository layout", () => {
  it.each(requiredDocs)("keeps $path as a checked-in guide entrypoint", async ({ path, heading }) => {
    const absolutePath = resolve(repoRoot, path)
    const file = await stat(absolutePath)
    const content = await readFile(absolutePath, "utf8")

    expect(file.isFile()).toBe(true)
    expect(content).toContain(heading)
  })

  it("keeps the SSE guide example actionable with a local mapping helper", async () => {
    const absolutePath = resolve(repoRoot, "docs/integration/sse.md")
    const content = await readFile(absolutePath, "utf8")

    expect(content).toContain("function mapSsePayload")
  })

  it("keeps the README pointed at the main user-facing docs tree", async () => {
    const content = await readFile(resolve(repoRoot, "README.md"), "utf8")

    expect(content).toContain("./docs/integration/upload-lifecycle.md")
    expect(content).toContain("./docs/advanced/artifact-renderers.md")
  })

  it("moves internal planning material out of docs/", () => {
    expect(existsSync(resolve(repoRoot, "docs/superpowers"))).toBe(false)

    expect(existsSync(resolve(repoRoot, "planning/specs"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "planning/plans"))).toBe(true)

    for (const file of planningSpecs) {
      expect(existsSync(resolve(repoRoot, "planning/specs", file))).toBe(true)
      expect(existsSync(resolve(repoRoot, "docs/superpowers/specs", file))).toBe(false)
    }

    for (const file of planningPlans) {
      expect(existsSync(resolve(repoRoot, "planning/plans", file))).toBe(true)
      expect(existsSync(resolve(repoRoot, "docs/superpowers/plans", file))).toBe(false)
    }
  })
})
