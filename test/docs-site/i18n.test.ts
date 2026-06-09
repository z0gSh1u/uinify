/* @vitest-environment node */

import { readdir, readFile, stat } from "node:fs/promises"
import { dirname, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const docsRoot = resolve(repoRoot, "docs-site/src/content/docs")
const zhCnRoot = resolve(docsRoot, "zh-cn")

async function collectMdxFiles(root: string, base = root): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = resolve(root, entry.name)

      if (entry.isDirectory()) {
        if (absolutePath === zhCnRoot) {
          return []
        }

        return collectMdxFiles(absolutePath, base)
      }

      if (!entry.isFile() || !entry.name.endsWith(".mdx")) {
        return []
      }

      return [relative(base, absolutePath)]
    }),
  )

  return files.flat().sort()
}

describe("docs site i18n", () => {
  it("configures Starlight with English root content and Simplified Chinese", async () => {
    const config = await readFile(resolve(repoRoot, "docs-site/astro.config.mjs"), "utf8")

    expect(config).toContain('defaultLocale: "root"')
    expect(config).toContain('"zh-cn"')
    expect(config).toContain('lang: "zh-CN"')
    expect(config).toContain('label: "简体中文"')
  })

  it("translates top-level sidebar groups for zh-CN", async () => {
    const config = await readFile(resolve(repoRoot, "docs-site/astro.config.mjs"), "utf8")

    for (const label of ["入门", "指南", "集成", "组件", "样式", "进阶"]) {
      expect(config).toContain(`"zh-CN": "${label}"`)
    }
  })

  it("keeps a zh-cn page for every root English docs page", async () => {
    const englishPages = await collectMdxFiles(docsRoot)

    await Promise.all(
      englishPages.map(async (page) => {
        const localizedPage = resolve(zhCnRoot, page)
        const file = await stat(localizedPage)

        expect(file.isFile()).toBe(true)
      }),
    )
  })

  it("keeps Chinese docs linked within the zh-cn route tree", async () => {
    const index = await readFile(resolve(zhCnRoot, "index.mdx"), "utf8")
    const gettingStarted = await readFile(resolve(zhCnRoot, "getting-started.mdx"), "utf8")

    expect(index).toContain("欢迎使用 uinify")
    expect(index).toContain("/zh-cn/getting-started/")
    expect(gettingStarted).toContain("/zh-cn/guides/core-concepts/")
  })
})
