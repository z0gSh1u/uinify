/* @vitest-environment node */

import { existsSync } from "node:fs"
import { readFile, stat } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..")

const requiredDocs = [
  { path: "docs-site/src/content/docs/guides/core-concepts.mdx", heading: "title: Core Concepts" },
  { path: "docs-site/src/content/docs/guides/examples.mdx", heading: "title: Examples" },
  { path: "docs-site/src/content/docs/integration/sse.mdx", heading: "title: SSE Integration" },
  { path: "docs-site/src/content/docs/components/message-list.mdx", heading: "title: Message List" },
  { path: "docs-site/src/content/docs/components/composer-lexical.mdx", heading: "title: Lexical Composer" },
  { path: "docs-site/src/content/docs/styling/theming.mdx", heading: "title: Theming" },
  { path: "docs-site/src/content/docs/styling/slots.mdx", heading: "title: Stable Slots" },
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
    const absolutePath = resolve(repoRoot, "docs-site/src/content/docs/integration/sse.mdx")
    const content = await readFile(absolutePath, "utf8")

    expect(content).toContain("function mapSsePayload")
  })

  it("keeps the README pointed at the docs site", async () => {
    const content = await readFile(resolve(repoRoot, "README.md"), "utf8")

    expect(content).toContain("uinify docs")
    expect(content).toContain("docs:dev")
  })

  it("moves internal planning material out of docs/", () => {
    expect(existsSync(resolve(repoRoot, "docs"))).toBe(false)

    expect(existsSync(resolve(repoRoot, "planning/specs"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "planning/plans"))).toBe(true)

    for (const file of planningSpecs) {
      expect(existsSync(resolve(repoRoot, "planning/specs", file))).toBe(true)
    }

    for (const file of planningPlans) {
      expect(existsSync(resolve(repoRoot, "planning/plans", file))).toBe(true)
    }
  })
})
