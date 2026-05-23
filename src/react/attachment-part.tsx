import type { UiAttachmentPart } from "../model/types"

export type AttachmentPartProps = {
  part: UiAttachmentPart
}

export function AttachmentPart({ part }: AttachmentPartProps) {
  const { error, name, progress, rejection, remoteUrl, sourceAttachmentId, status } = part.attachment

  const stageLabel = rejection
    ? "Rejected"
    : status === "queued"
      ? "Queued"
      : status === "uploading"
        ? "Uploading"
        : status === "uploaded"
          ? "Uploaded"
          : status === "error"
            ? "Upload failed"
            : null
  const detail = rejection?.message ?? error

  return (
    <div data-slot="attachment-part" data-state={status}>
      {remoteUrl ? <a href={remoteUrl}>{name}</a> : <span>{name}</span>}
      {stageLabel ? <div>{stageLabel}</div> : null}
      {progress !== undefined ? <div>{progress}% uploaded</div> : null}
      {detail && detail !== stageLabel ? <div>{detail}</div> : null}
      {sourceAttachmentId ? <div>Linked to an earlier attachment</div> : null}
    </div>
  )
}
