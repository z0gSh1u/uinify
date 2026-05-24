# Docs Site Design

Date: 2026-05-24

## Summary

Build a static documentation site for uinify using Astro + Starlight, deployed to GitHub Pages. The site renders the existing 12 user-facing Markdown documents with navigation, search, and syntax highlighting. Content lives in the monorepo under `docs-site/`.

## Requirements

- Static site, no server-side rendering
- Deploy to GitHub Pages
- Only user-facing docs (no `planning/` content)
- Default Starlight theme, no custom branding
- No interactive playground (future consideration)
- Monorepo: `docs-site/` alongside `src/`, `examples/`

## Tech Stack

**Astro + Starlight**

- Framework-agnostic; React components embeddable via island architecture for future playground
- Starlight provides docs-specific defaults: sidebar, search (Pagefind), syntax highlighting (Shiki)
- Independent `package.json` in `docs-site/`, no coupling to main package build

Alternatives considered:
- **VitePress**: lightest option but Vue-specific; no advantage over Astro for a monorepo
- **Docusaurus**: React-aligned but heavier config (Webpack); overkill for 12 docs

## Project Structure

```
uinify/
├── docs-site/
│   ├── astro.config.mjs
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   └── content/
│   │       └── docs/
│   │           ├── index.mdx
│   │           ├── getting-started.mdx
│   │           ├── guides/
│   │           │   ├── core-concepts.mdx
│   │           │   └── examples.mdx
│   │           ├── integration/
│   │           │   ├── stream-mapping.mdx
│   │           │   ├── sse.mdx
│   │           │   └── upload-lifecycle.mdx
│   │           ├── components/
│   │           │   ├── message-list.mdx
│   │           │   └── composer-lexical.mdx
│   │           ├── styling/
│   │           │   ├── theming.mdx
│   │           │   └── slots.mdx
│   │           └── advanced/
│   │               ├── artifact-renderers.mdx
│   │               └── stability.mdx
│   └── public/
├── src/
├── examples/
└── planning/
```

The existing `docs/` directory is removed after migration. All content moves into `docs-site/src/content/docs/`.

## Navigation

**Top navbar:**
- Left: uinify logo + name
- Right: GitHub repository link

**Sidebar groups (auto-generated from directory structure):**

- Getting Started (top-level)
- Guides (group)
- Integration (group)
- Components (group)
- Styling (group)
- Advanced (group)

**Search:** Pagefind, bundled with Starlight, zero config.

**Not included:** version switcher, i18n.

## Content Conventions

Each `.mdx` file requires frontmatter:

```yaml
---
title: Getting Started
description: Quick start guide for uinify
---
```

Sidebar ordering follows filename sort by default. Override with `sidebar.order` frontmatter when needed.

Internal links use Astro path format: `/integration/stream-mapping/` (trailing slash, no extension). Starlight generates slugs from file path.

Code blocks use Shiki syntax highlighting (built into Starlight). Supports TSX, TypeScript, and all languages used in existing docs.

## Build and Deploy

**docs-site/package.json scripts:**

| Script | Command |
|--------|---------|
| `dev` | `astro dev` |
| `build` | `astro build` |
| `preview` | `astro preview` |

**Root package.json additions:**

| Script | Command |
|--------|---------|
| `docs:dev` | `pnpm --filter docs-site dev` |
| `docs:build` | `pnpm --filter docs-site build` |
| `docs:preview` | `pnpm --filter docs-site preview` |

**Dependencies:** `astro`, `@astrojs/starlight`. No dependency on main package build output.

**GitHub Actions workflow** (`.github/workflows/docs.yml`):
- Trigger: push to `master`, paths `docs-site/**`
- Steps: pnpm install → build → deploy to GitHub Pages
- Uses `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`

## Migration Steps

1. Scaffold `docs-site/` with Astro + Starlight
2. Move `docs/*.md` into `docs-site/src/content/docs/`, rename to `.mdx`, add frontmatter
3. Update internal links to Astro path format
4. Configure `astro.config.mjs` with sidebar and navbar
5. Add root package.json scripts (`docs:dev`, `docs:build`, `docs:preview`)
6. Add GitHub Actions workflow for GitHub Pages deployment
7. Update `README.md` doc links to point at docs site URL
8. Update `AGENTS.md` to note `docs/` migrated to `docs-site/`
9. Delete original `docs/` directory
10. Verify: `pnpm docs:dev` works locally, `pnpm docs:build` produces static output
