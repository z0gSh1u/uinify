import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"

const examplesRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "examples")

export default defineConfig({
  root: examplesRoot,
  publicDir: false,
  build: {
    outDir: resolve(examplesRoot, "dist-example"),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(examplesRoot, "index.html"),
    },
  },
})
