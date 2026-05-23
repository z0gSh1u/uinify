/* @vitest-environment node */

import { describe, expect, it } from "vitest"
import exampleViteConfig from "../../vite.example.config"

describe("example vite config", () => {
  it("uses the playground as the explicit dev and build entry", () => {
    expect(String(exampleViteConfig.root)).toContain("examples/playground")
    expect(String(exampleViteConfig.build?.outDir)).toContain("examples/playground/dist-example")
    expect(String(exampleViteConfig.build?.rollupOptions?.input)).toContain("examples/playground/index.html")
  })
})
