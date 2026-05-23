import { useState } from "react"
import { exampleTemplateSections, type ExampleTemplate } from "../fixtures"
import { AdapterTemplate } from "../templates/adapter-template"
import { ArtifactTemplate } from "../templates/artifact-template"
import { MinimalAppTemplate } from "../templates/minimal-app"
import { UploadTemplate } from "../templates/upload-template"
import artifactDocsHref from "../../docs/advanced/artifact-renderers.md?url"
import gettingStartedDocsHref from "../../docs/getting-started.md?url"
import streamMappingDocsHref from "../../docs/integration/stream-mapping.md?url"
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

export function ExamplePlayground() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<ExampleTemplate["id"]>(templates[0].id)

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? templates[0]
  const SelectedTemplate = templateRegistry[selectedTemplate.id]
  const selectedDocsHref = docsHrefByPath[selectedTemplate.docsPath]

  return (
    <main className="playground-shell">
      <header className="playground-header">
        <p className="playground-kicker">uinify</p>
        <h1>Example Playground</h1>
        <p>Browse the supported integration shapes, then jump to the matching guide.</p>
      </header>

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
