import type { UiArtifactPart } from "../model/types"

export type ArtifactCodeBlockProps = {
  part: UiArtifactPart
}

export function ArtifactCodeBlock({ part }: ArtifactCodeBlockProps) {
  const { artifact } = part
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
