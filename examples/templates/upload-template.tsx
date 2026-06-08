import { useState } from "react"
import type { UiComposerAttachment, UiComposerValue } from "../../src"
import { LexicalComposer } from "../../src/composer/lexical"

function createInitialAttachments(): UiComposerAttachment[] {
  return [
    {
      id: "release-notes",
      file: new File(["release notes"], "release-notes.pdf", { type: "application/pdf" }),
      name: "release-notes.pdf",
      mimeType: "application/pdf",
      size: 204800,
      status: "uploading",
      progress: 65,
    },
  ]
}

export function UploadTemplate() {
  const [attachments, setAttachments] = useState(createInitialAttachments)
  const [submittedSummary, setSubmittedSummary] = useState<string | null>(null)

  const hasUploadingAttachments = attachments.some((attachment) => attachment.status === "uploading")

  function completeUpload() {
    setSubmittedSummary(null)
    setAttachments((current) =>
      current.map((attachment) =>
        attachment.id === "release-notes"
          ? {
              ...attachment,
              progress: 100,
              remoteUrl: "https://example.com/uploads/release-notes.pdf",
              status: "uploaded",
            }
          : attachment,
      ),
    )
  }

  function resetUpload() {
    setSubmittedSummary(null)
    setAttachments(createInitialAttachments())
  }

  function handleSubmit(value: UiComposerValue) {
    setSubmittedSummary(`${value.attachments.length} attachment submitted`)
    setAttachments([])
  }

  return (
    <section>
      <h2>Upload orchestration template</h2>
      <p>Controlled attachments keep upload progression in host-owned state.</p>
      <div aria-label="Upload controls" className="example-toolbar" role="group">
        <button disabled={!hasUploadingAttachments} onClick={completeUpload} type="button">
          Complete upload
        </button>
        <button onClick={resetUpload} type="button">
          Reset upload
        </button>
      </div>
      {submittedSummary ? <p role="status">{submittedSummary}</p> : null}
      <LexicalComposer
        attachments={attachments}
        onAttachmentsChange={setAttachments}
        onSubmit={handleSubmit}
        sendPolicy="uploaded-only"
      />
    </section>
  )
}
