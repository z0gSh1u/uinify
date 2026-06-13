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

  it("keeps the real chat example as the only examples page", () => {
    const index = readRepoFile("examples/index.html")
    const app = readRepoFile("examples/src/App.tsx")
    const chatExample = readRepoFile("examples/src/chat/ChatExample.tsx")
    const config = readRepoFile("vite.example.config.ts")

    expect(index).toContain('src="./src/main.tsx"')
    expect(app).toContain('"/chat"')
    expect(app).toContain("ChatExample")
    expect(app).toContain("https://github.com/z0gSh1u/uinify")
    expect(app).toContain("examples-github-link")
    expect(app).not.toContain("examples-sidebar")
    expect(app).not.toContain("Example routes")
    expect(app).not.toContain("routes.map")
    expect(app).not.toContain('path: "/playground"')
    expect(app).not.toContain("ExamplePlayground")
    expect(app).not.toContain("docs-site")
    expect(app).not.toContain("UINIFY_LLM_API_KEY")
    expect(chatExample).toContain("LiveChatPanel")
    expect(chatExample).toContain("SurfaceGalleryPanel")
    expect(chatExample).not.toContain("fetch(")
    expect(chatExample).not.toContain("createChatRuntime")
    expect(chatExample).not.toContain("LexicalComposer")
    expect(chatExample).not.toContain("<textarea")
    expect(config).toContain("createOpenAICompatibleChatPlugin")
    expect(existsSync(resolve(repoRoot, "examples/src/chat/ChatExample.tsx"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "examples/src/chat/live/LiveChatPanel.tsx"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "examples/src/chat/gallery/SurfaceGalleryPanel.tsx"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "examples/src/chat/shared/files.ts"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "examples/chat"))).toBe(false)
    expect(existsSync(resolve(repoRoot, "examples/server/openai-compatible-chat.ts"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "examples/playground"))).toBe(false)
    expect(existsSync(resolve(repoRoot, "examples/adapters"))).toBe(false)
    expect(existsSync(resolve(repoRoot, "examples/playground/index.html"))).toBe(false)
  })
})
