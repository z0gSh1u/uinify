import { useState } from "react"
import type { UiComposerAttachment, UiComposerValue } from "../../src"
import { LexicalComposer } from "../../src/composer/lexical"

const initialAttachments: UiComposerAttachment[] = [
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

export function UploadTemplate() {
  const [attachments, setAttachments] = useState(initialAttachments)

  function handleSubmit(_value: UiComposerValue) {
    setAttachments([])
  }

  return (
    <section>
      <h2>Upload orchestration template</h2>
      <p>Controlled attachments keep upload progression in host-owned state.</p>
      <LexicalComposer
        attachments={attachments}
        onAttachmentsChange={setAttachments}
        onSubmit={handleSubmit}
        sendPolicy="uploaded-only"
      />
    </section>
  )
}
