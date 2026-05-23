import { exampleTemplateSections, type ExampleTemplate } from "../fixtures"
import { AdapterTemplate } from "../templates/adapter-template"
import { ArtifactTemplate } from "../templates/artifact-template"
import { MinimalAppTemplate } from "../templates/minimal-app"
import { UploadTemplate } from "../templates/upload-template"

const templateRegistry = {
  minimal: MinimalAppTemplate,
  adapter: AdapterTemplate,
  upload: UploadTemplate,
  artifact: ArtifactTemplate,
} satisfies Record<ExampleTemplate["id"], () => React.JSX.Element>

export function ExamplePlayground() {
  return (
    <main>
      <h1>uinify examples</h1>
      {exampleTemplateSections.map((group) => {
        return (
          <section key={group.id}>
            <h2>{group.title}</h2>
            <ul>
              {group.templates.map((template) => (
                <li key={`${template.id}-docs`}>
                  <a href={template.docsPath}>{template.title}</a>
                  <p>{template.description}</p>
                </li>
              ))}
            </ul>
            {group.templates.map((template) => {
              const Template = templateRegistry[template.id]

              return <Template key={template.id} />
            })}
          </section>
        )
      })}
    </main>
  )
}
