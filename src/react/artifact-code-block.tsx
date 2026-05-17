import type { UiArtifact } from "../model/types"

export type ArtifactCodeBlockProps = {
  artifact: UiArtifact
}

export function ArtifactCodeBlock({ artifact }: ArtifactCodeBlockProps) {
  const label = artifact.kind === "code" ? artifact.language ?? "code" : "text"

  return (
    <section>
      <header>{label}</header>
      <div>
        <pre>
          {artifact.kind === "code" ? <code>{artifact.content}</code> : artifact.content}
        </pre>
      </div>
    </section>
  )
}
