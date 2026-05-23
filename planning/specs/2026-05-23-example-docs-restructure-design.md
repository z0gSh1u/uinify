# Example And Docs Restructure Design

## Summary

This project needs three linked improvements:

1. the example playground must run correctly with `pnpm dev:example`
2. `examples/` must separate runnable examples from test-only support files
3. `docs/` must become a clean user-facing documentation tree, while internal planning material moves out to `planning/`

The goal is not to redesign `uinify` itself. The goal is to make the existing package explorable, runnable, and understandable for a new adopter.

## Problems

### Broken Example Entry

`pnpm dev:example` currently launches Vite, but the example site is not configured as a proper standalone app entry. The result is a dev server that starts without a reliable root-page experience.

### Blurry Example Boundaries

`examples/` currently mixes together:

- the runnable playground app
- copyable example templates
- protocol fixtures
- example-focused tests

That structure makes it hard to tell which files are product-facing examples, which are support fixtures, and which are only for tests.

### Blurry Docs Boundaries

`docs/` currently mixes together:

- real user documentation
- internal design specs
- internal implementation plans

That makes the documentation tree feel unfinished and low-trust for external users.

## Goals

- make `pnpm dev:example` open a working playground from `/`
- keep `pnpm build:example` working against the same entry structure
- reorganize `examples/` around clear responsibilities
- reorganize `docs/` into a more complete user-facing information architecture
- move internal design and plan files out of `docs/` into `planning/`
- improve documentation coverage so a first-time adopter can understand how to install, integrate, style, and extend `uinify`

## Non-Goals

- no new backend protocol support
- no major runtime or renderer feature expansion beyond what documentation/examples need
- no conversion into a monorepo or separate docs site framework
- no large visual redesign of the example playground beyond what is needed to make it a clear example hub

## Recommended Approach

Use a medium-scope restructuring that fixes the broken example app, clarifies repository information architecture, and upgrades docs coverage in one coordinated pass.

This is the smallest approach that addresses the root problem instead of only patching the broken Vite command.

## Target Repository Structure

### Examples

`examples/` should become the home for runnable and copyable example material only.

Target structure:

```text
examples/
  playground/
    index.html
    main.tsx
    App.tsx
  templates/
    minimal-app.tsx
    adapter-template.tsx
    upload-template.tsx
    artifact-template.tsx
  fixtures/
    index.ts
  adapters/
    agent-like.ts
    custom-minimal.ts
    openai-like.ts
    protocol-fixtures.ts
  tests/
    example-flows.test.tsx
    fixtures.test.ts
    templates.test.tsx
    reference-mappers.test.ts
```

Rules:

- `playground/` is the runnable site
- `templates/` are copyable docs-backed snippets/components
- `fixtures/` are reusable example data sources for both playground and tests
- `adapters/` remain reference-only integration examples
- `tests/` holds example-specific test files instead of scattering them at the top of `examples/`

### Documentation

`docs/` should contain only user-facing documentation.

Target structure:

```text
docs/
  getting-started.md
  guides/
    core-concepts.md
    examples.md
  integration/
    stream-mapping.md
    sse.md
    upload-lifecycle.md
  components/
    message-list.md
    composer-lexical.md
  styling/
    theming.md
    slots.md
  advanced/
    artifact-renderers.md
    stability.md
```

`planning/` becomes the internal home for roadmap and implementation material.

Target structure:

```text
planning/
  specs/
  plans/
```

Rules:

- `docs/` is written for library adopters
- `planning/` is written for maintainers
- README links into `docs/` and the runnable example app, but does not act as the full manual

## Playground Design

The playground should be a lightweight example hub instead of a long page that only stacks templates.

It should provide:

- a visible list of examples/templates
- a preview area for the selected example
- a short description of what the example demonstrates
- a link to the matching documentation page
- clear distinction between "copy this integration shape" and "reference-only"

The playground should stay simple and local. It does not need routing, search, or a docs-site feature set unless that is required by the final implementation to keep the code clean.

## Example Build And Entry Design

The example app should be wired as an explicit Vite app entry rather than relying on ambiguous HTML discovery.

The implementation should:

- configure Vite so `examples/playground/index.html` is the clear dev/build entry
- ensure root-path loading works from `http://localhost:5173/`
- keep the example build output isolated from source files
- avoid hand-editing generated example build output

If needed, the example app can get a dedicated Vite config file to keep example concerns separate from library test configuration.

## Documentation Maturity Target

This pass should make the docs good enough for a new engineer to integrate `uinify` without reading large parts of the source.

Minimum doc set:

- install and first render path
- core concepts: runtime, transcript model, `UiStreamEvent`, host-owned orchestration
- mapping external events into `UiStreamEvent`
- SSE helper usage and boundaries
- Lexical composer usage, including attachments, mention, and slash command hooks
- artifact, reasoning, and tool-call rendering model
- theming and slot customization model
- stability guidance: recommended surface vs reference-only surface
- example index page that explains how playground, templates, and reference adapters relate

The docs should prefer short, practical guidance plus copyable snippets over abstract theory.

## Migration Requirements

This restructure will require coordinated path updates.

Expected migration work:

- update imports that reference moved example fixture files
- update tests that reference example file paths or titles
- update README links to moved docs pages when needed
- update docs that reference example template locations
- move existing `docs/superpowers/specs/*` and `docs/superpowers/plans/*` into `planning/`

Backward-compatibility redirects inside the repo are unnecessary. This is an internal repository cleanup, not a published URL migration system.

## Testing And Verification

Success requires explicit verification of the reorganized structure.

Required checks:

- `pnpm dev:example` starts and serves a working playground root page
- `pnpm build:example` succeeds
- `pnpm typecheck` succeeds
- `pnpm test` succeeds after moved files and updated imports
- docs/example metadata tests still verify title and path alignment

## Risks

### Import Churn

Moving example support files and tests will create path churn. This is acceptable, but the implementation should keep renames mechanical and minimal.

### Docs Drift

As docs coverage expands, example labels, paths, and template metadata can drift apart. Existing docs/example alignment tests should be preserved and extended where needed.

### Overbuilding The Playground

The playground should remain an example browser, not become a second product surface with heavy state, routing, or custom infrastructure.

## Recommendation

Proceed with a single coordinated restructure covering example entry, repository information architecture, and documentation maturity together.

Doing only the Vite fix would leave the underlying repository confusion in place. Doing a full docs-site rebuild would be larger than necessary. This middle path addresses the real usability problems with controlled scope.
