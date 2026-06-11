import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

const repoRoot = resolve(import.meta.dirname, "../..")

function readRepoFile(path: string) {
  return readFileSync(resolve(repoRoot, path), "utf8")
}

describe("examples Vite app", () => {
  it("uses examples as the Vite app root", () => {
    const config = readRepoFile("vite.example.config.ts")

    expect(config).toContain('"examples"')
    expect(config).toContain('"dist-example"')
    expect(config).not.toContain('"examples/playground"')
  })

  it("mounts playground as an app route instead of the Vite entry root", () => {
    const index = readRepoFile("examples/index.html")
    const app = readRepoFile("examples/src/App.tsx")

    expect(index).toContain('src="./src/main.tsx"')
    expect(app).toContain('path: "/playground"')
    expect(app).toContain("ExamplePlayground")
    expect(app).not.toContain("docs-site")
    expect(existsSync(resolve(repoRoot, "examples/playground/index.html"))).toBe(false)
  })

  it("keeps the real chat example as an examples app route", () => {
    const app = readRepoFile("examples/src/App.tsx")
    const config = readRepoFile("vite.example.config.ts")

    expect(app).toContain('path: "/chat"')
    expect(app).toContain("ChatExample")
    expect(app).not.toContain("UINIFY_LLM_API_KEY")
    expect(config).toContain("createOpenAICompatibleChatPlugin")
  })
})
