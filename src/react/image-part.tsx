import type { UiImagePart } from "../model/types"

export type ImagePartProps = {
  part: UiImagePart
}

export function ImagePart({ part }: ImagePartProps) {
  return <img alt={part.alt ?? ""} src={part.url} />
}
