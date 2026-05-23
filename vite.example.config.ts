import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"

const playgroundRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "examples/playground")

export default defineConfig({
  root: playgroundRoot,
  publicDir: false,
  build: {
    outDir: resolve(playgroundRoot, "dist-example"),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(playgroundRoot, "index.html"),
    },
  },
})
