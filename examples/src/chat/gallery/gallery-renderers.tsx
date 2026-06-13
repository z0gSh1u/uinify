import type { ImageRendererProps, MessageRendererOverrides } from "../../../../src/react"

export function renderGalleryImage({ part }: ImageRendererProps) {
  return (
    <img
      alt={part.alt ?? "Gallery image"}
      className="surface-gallery-image"
      data-gallery-image="showcase"
      height={part.height}
      src={part.url}
      width={part.width}
    />
  )
}

export const galleryRenderers: MessageRendererOverrides = {
  renderImage: renderGalleryImage,
}
