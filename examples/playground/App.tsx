import { useState } from "react"
import { exampleTemplateSections, type ExampleTemplate } from "../fixtures"
import { AdapterTemplate } from "../templates/adapter-template"
import { AgentShowcaseTemplate } from "../templates/agent-showcase-template"
import { ArtifactTemplate } from "../templates/artifact-template"
import { MinimalAppTemplate } from "../templates/minimal-app"
import { MultimodalTemplate } from "../templates/multimodal-template"
import { UploadTemplate } from "../templates/upload-template"
import artifactDocsHref from "../../docs-site/src/content/docs/advanced/artifact-renderers.mdx?url"
import composerDocsHref from "../../docs-site/src/content/docs/components/composer-lexical.mdx?url"
import gettingStartedDocsHref from "../../docs-site/src/content/docs/getting-started.mdx?url"
import layeredPublicApiDocsHref from "../../docs-site/src/content/docs/guides/layered-public-api.mdx?url"
import multimodalImagesDocsHref from "../../docs-site/src/content/docs/integration/multimodal-images.mdx?url"
import streamMappingDocsHref from "../../docs-site/src/content/docs/integration/stream-mapping.mdx?url"
import uploadLifecycleDocsHref from "../../docs-site/src/content/docs/integration/upload-lifecycle.mdx?url"

const templateRegistry = {
  minimal: MinimalAppTemplate,
  adapter: AdapterTemplate,
  multimodal: MultimodalTemplate,
  upload: UploadTemplate,
  "agent-showcase": AgentShowcaseTemplate,
  artifact: ArtifactTemplate,
} satisfies Record<ExampleTemplate["id"], () => React.JSX.Element>

const templates = exampleTemplateSections.flatMap((section) => section.templates)

const docsHrefByPath = {
  "docs/getting-started.md": gettingStartedDocsHref,
  "docs/components/composer-lexical.md": composerDocsHref,
  "docs/integration/stream-mapping.md": streamMappingDocsHref,
  "docs/integration/multimodal-images.md": multimodalImagesDocsHref,
  "docs/integration/upload-lifecycle.md": uploadLifecycleDocsHref,
  "docs/guides/layered-public-api.md": layeredPublicApiDocsHref,
  "docs/advanced/artifact-renderers.md": artifactDocsHref,
} satisfies Record<ExampleTemplate["docsPath"], string>

export function ExamplePlayground() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<ExampleTemplate["id"]>(templates[0].id)

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? templates[0]
  const SelectedTemplate = templateRegistry[selectedTemplate.id]
  const selectedDocsHref = docsHrefByPath[selectedTemplate.docsPath]

  return (
    <main className="playground-shell">
      <div className="playground-layout">
        <aside className="playground-sidebar" aria-label="Example templates">
          <header className="playground-sidebar-header">
            <p>uinify</p>
            <h1>uinify examples</h1>
          </header>

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
              <p className="playground-preview-title">{selectedTemplate.title}</p>
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
