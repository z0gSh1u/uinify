import type { UiArtifactPart } from "../model/types"
import { getDefaultArtifactView, renderDefaultArtifactBody } from "./artifact-body"

export type ArtifactCodeBlockProps = {
  part: UiArtifactPart
}

export function ArtifactCodeBlock({ part }: ArtifactCodeBlockProps) {
  const { artifact } = part
  const view = getDefaultArtifactView(artifact) ?? null
  const label = view?.label ?? artifact.title ?? artifact.kind

  return (
    <section>
      <header>{label}</header>
      <div>{view ? renderDefaultArtifactBody({ artifact, part, view }) : null}</div>
    </section>
  )
}
