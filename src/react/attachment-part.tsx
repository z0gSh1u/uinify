import type { UiAttachmentPart } from "../model/types"

export type AttachmentPartProps = {
  part: UiAttachmentPart
}

export function AttachmentPart({ part }: AttachmentPartProps) {
  const { error, name, progress, remoteUrl, status } = part.attachment

  return (
    <div data-slot="attachment-part" data-state={status}>
      {remoteUrl ? <a href={remoteUrl}>{name}</a> : <span>{name}</span>}
      {progress !== undefined ? <div>{String(progress)}</div> : null}
      {error ? <div>{error}</div> : null}
    </div>
  )
}
