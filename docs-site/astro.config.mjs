import { defineConfig } from "astro/config"
import starlight from "@astrojs/starlight"

export default defineConfig({
  site: "https://z0gsh1u.github.io",
  base: "/uinify",
  trailingSlash: "always",
  integrations: [
    starlight({
      title: "uinify",
      defaultLocale: "root",
      locales: {
        root: {
          label: "English",
          lang: "en",
        },
        "zh-cn": {
          label: "简体中文",
          lang: "zh-CN",
        },
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/z0gSh1u/uinify",
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          translations: { "zh-CN": "入门" },
          slug: "getting-started",
        },
        {
          label: "Guides",
          translations: { "zh-CN": "指南" },
          items: [
            { slug: "guides/core-concepts" },
            { slug: "guides/layered-public-api" },
            { slug: "guides/examples" },
          ],
        },
        {
          label: "Integration",
          translations: { "zh-CN": "集成" },
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
          translations: { "zh-CN": "组件" },
          items: [
            { slug: "components/message-list" },
            { slug: "components/step-block" },
            { slug: "components/composer-lexical" },
            { slug: "components/composer-commands" },
          ],
        },
        {
          label: "Styling",
          translations: { "zh-CN": "样式" },
          items: [{ slug: "styling/theming" }, { slug: "styling/slots" }],
        },
        {
          label: "Advanced",
          translations: { "zh-CN": "进阶" },
          items: [
            { slug: "advanced/artifact-renderers" },
            { slug: "advanced/stability" },
          ],
        },
      ],
    }),
  ],
})
