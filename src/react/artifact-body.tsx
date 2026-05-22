import type { UiArtifact, UiArtifactPart, UiArtifactView } from "../model/types"
import { useRenderers, type ArtifactRendererProps } from "./renderers"

export type ArtifactBodyProps = {
  artifact: UiArtifact
  part: UiArtifactPart
  view: UiArtifactView
}

export function getDefaultArtifactView(artifact: UiArtifact) {
  return artifact.views.find((view) => view.id === artifact.defaultViewId) ?? artifact.views[0]
}

type DefaultArtifactRendererProps = Pick<ArtifactRendererProps, "view"> & Partial<ArtifactRendererProps>

function getViewContent(view: UiArtifactView): string {
  if (typeof view.value === "string") {
    return view.value
  }

  try {
    return JSON.stringify(view.value, null, 2)
  } catch {
    return "[structured artifact view unavailable]"
  }
}

function getJsonContent(view: UiArtifactView): string {
  if (typeof view.value !== "string") {
    return getViewContent(view)
  }

  try {
    return JSON.stringify(JSON.parse(view.value), null, 2)
  } catch {
    return view.value
  }
}

function getArtifactRenderer(
  artifactRegistry: Record<string, (props: ArtifactRendererProps) => React.ReactNode> | undefined,
  artifactKind: string,
) {
  if (!artifactRegistry || !Object.hasOwn(artifactRegistry, artifactKind)) {
    return undefined
  }

  return artifactRegistry[artifactKind]
}

export function renderDefaultArtifactBody({ artifact, view }: DefaultArtifactRendererProps) {
  const content = getViewContent(view)
  const artifactKind = artifact?.kind

  if (artifactKind === "code" || view.kind === "source") {
    return (
      <pre>
        <code>{content}</code>
      </pre>
    )
  }

  if (artifactKind === "json") {
    return <pre>{getJsonContent(view)}</pre>
  }

  if (artifactKind === "text" && typeof view.value === "string") {
    return <div style={{ whiteSpace: "pre-wrap" }}>{content}</div>
  }

  return <pre>{content}</pre>
}

export function ArtifactBody({ artifact, part, view }: ArtifactBodyProps) {
  const renderers = useRenderers()
  const props: ArtifactRendererProps = { artifact, part, view }
  const renderer = getArtifactRenderer(renderers.artifactRegistry, artifact.kind)

  if (renderer) {
    return <>{renderer(props)}</>
  }

  if (renderers.renderArtifactFallback) {
    return <>{renderers.renderArtifactFallback(props)}</>
  }

  return renderDefaultArtifactBody(props)
}
