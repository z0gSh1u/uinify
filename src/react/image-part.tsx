import { useState } from "react"
import type { UiImagePart } from "../model/types"

export type ImagePartProps = {
  part: UiImagePart
}

export function ImagePart({ part }: ImagePartProps) {
  const [failed, setFailed] = useState(false)

  return (
    <figure
      data-mime-type={part.mimeType}
      data-slot="image"
      data-source-attachment-id={part.sourceAttachmentId}
      data-state={failed ? "error" : "loaded"}
    >
      {failed ? null : (
        <img
          alt={part.alt ?? ""}
          height={part.height}
          onError={() => setFailed(true)}
          src={part.url}
          width={part.width}
        />
      )}
      {failed ? (
        <figcaption data-slot="image-fallback">
          {part.alt ? `Image failed to load: ${part.alt}` : "Image failed to load"}
        </figcaption>
      ) : part.alt ? (
        <figcaption data-slot="image-caption">{part.alt}</figcaption>
      ) : null}
    </figure>
  )
}
