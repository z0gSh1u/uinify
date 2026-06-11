import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig, loadEnv } from "vite"
import { createOpenAICompatibleChatPlugin } from "./examples/server/openai-compatible-chat"

const examplesRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "examples")
const repoRoot = fileURLToPath(new URL(".", import.meta.url))

export default defineConfig(({ mode }) => ({
  root: examplesRoot,
  publicDir: false,
  plugins: [createOpenAICompatibleChatPlugin(loadEnv(mode, repoRoot, ""))],
  build: {
    outDir: resolve(examplesRoot, "dist-example"),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(examplesRoot, "index.html"),
    },
  },
}))
