import { defineConfig } from "astro/config"
import starlight from "@astrojs/starlight"

export default defineConfig({
  site: "https://z0gsh1u.github.io",
  base: "/uinify",
  trailingSlash: "always",
  integrations: [
    starlight({
      title: "uinify",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/z0gSh1u/uinify",
        },
      ],
      sidebar: [
        { label: "Getting Started", slug: "getting-started" },
        {
          label: "Guides",
          items: [
            { slug: "guides/core-concepts" },
            { slug: "guides/layered-public-api" },
            { slug: "guides/examples" },
          ],
        },
        {
          label: "Integration",
          items: [
            { slug: "integration/stream-mapping" },
            { slug: "integration/agent-steps" },
            { slug: "integration/multimodal-images" },
            { slug: "integration/sse" },
            { slug: "integration/upload-lifecycle" },
          ],
        },
        {
          label: "Components",
          items: [
            { slug: "components/message-list" },
            { slug: "components/step-block" },
            { slug: "components/composer-lexical" },
            { slug: "components/composer-commands" },
          ],
        },
        {
          label: "Styling",
          items: [{ slug: "styling/theming" }, { slug: "styling/slots" }],
        },
        {
          label: "Advanced",
          items: [
            { slug: "advanced/artifact-renderers" },
            { slug: "advanced/stability" },
          ],
        },
      ],
    }),
  ],
})
