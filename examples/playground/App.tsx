import { useState } from "react"
import { exampleTemplateSections, type ExampleTemplate } from "../fixtures"
import { AdapterTemplate } from "../templates/adapter-template"
import { ArtifactTemplate } from "../templates/artifact-template"
import { MinimalAppTemplate } from "../templates/minimal-app"
import { UploadTemplate } from "../templates/upload-template"
import artifactDocsHref from "../../docs/advanced/artifact-renderers.md?url"
import composerDocsHref from "../../docs/components/composer-lexical.md?url"
import coreConceptsDocsHref from "../../docs/guides/core-concepts.md?url"
import gettingStartedDocsHref from "../../docs/getting-started.md?url"
import sseDocsHref from "../../docs/integration/sse.md?url"
import streamMappingDocsHref from "../../docs/integration/stream-mapping.md?url"
import themingDocsHref from "../../docs/styling/theming.md?url"
import uploadLifecycleDocsHref from "../../docs/integration/upload-lifecycle.md?url"

const templateRegistry = {
  minimal: MinimalAppTemplate,
  adapter: AdapterTemplate,
  upload: UploadTemplate,
  artifact: ArtifactTemplate,
} satisfies Record<ExampleTemplate["id"], () => React.JSX.Element>

const templates = exampleTemplateSections.flatMap((section) => section.templates)

const docsHrefByPath = {
  "docs/getting-started.md": gettingStartedDocsHref,
  "docs/integration/stream-mapping.md": streamMappingDocsHref,
  "docs/integration/upload-lifecycle.md": uploadLifecycleDocsHref,
  "docs/advanced/artifact-renderers.md": artifactDocsHref,
} satisfies Record<ExampleTemplate["docsPath"], string>

const integrationChecklist = [
  "Install package",
  "Import styles",
  "Create runtime",
  "Map events",
  "Render UI",
]

const docsMap = [
  { label: "Getting Started", href: gettingStartedDocsHref, description: "Render the smallest transcript." },
  { label: "Core Concepts", href: coreConceptsDocsHref, description: "Understand runtime and events." },
  { label: "Stream Mapping", href: streamMappingDocsHref, description: "Normalize host protocols." },
  { label: "SSE", href: sseDocsHref, description: "Read server-sent events." },
  { label: "Composer", href: composerDocsHref, description: "Wire input and attachments." },
  { label: "Styling", href: themingDocsHref, description: "Theme with tokens and slots." },
]

export function ExamplePlayground() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<ExampleTemplate["id"]>(templates[0].id)

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? templates[0]
  const SelectedTemplate = templateRegistry[selectedTemplate.id]
  const selectedDocsHref = docsHrefByPath[selectedTemplate.docsPath]

  return (
    <main className="playground-shell">
      <header className="playground-hero">
        <div className="playground-hero-copy">
          <p className="playground-kicker">uinify</p>
          <h1>Build chat UI with uinify</h1>
          <p>React-first chat UI foundation for backend-agnostic LLM apps.</p>
        </div>
        <div className="playground-command-card" aria-label="Run example playground">
          <span>Run locally</span>
          <code>pnpm dev:example</code>
        </div>
      </header>

      <section className="playground-intro-grid" aria-label="Playground guide">
        <section className="playground-info-card" aria-label="Integration checklist">
          <h2>Integration checklist</h2>
          <ol>
            {integrationChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>

        <nav className="playground-info-card playground-docs-map" aria-label="Docs map">
          <h2>Docs map</h2>
          <div>
            {docsMap.map((doc) => (
              <a key={doc.label} href={doc.href} aria-label={doc.label}>
                <span>{doc.label}</span>
                <small>{doc.description}</small>
              </a>
            ))}
          </div>
        </nav>
      </section>

      <div className="playground-layout">
        <aside className="playground-sidebar" aria-label="Example templates">
          {exampleTemplateSections.map((section) => (
            <section key={section.id} className="playground-section">
              <h2>{section.title}</h2>
              <div className="playground-template-list">
                {section.templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className="playground-template-button"
                    aria-label={template.title}
                    aria-pressed={template.id === selectedTemplate.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                  >
                    <span>{template.title}</span>
                    <small>{template.description}</small>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </aside>

        <section className="playground-preview" role="region" aria-label="Selected template preview">
          <div className="playground-preview-header">
            <div>
              <h2>{selectedTemplate.title}</h2>
              <p>{selectedTemplate.description}</p>
            </div>
            <a href={selectedDocsHref}>Read docs</a>
          </div>

          <div className="playground-preview-body">
            <SelectedTemplate />
          </div>
        </section>
      </div>
    </main>
  )
}
