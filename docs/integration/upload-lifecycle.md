# Upload Lifecycle

`uinify` treats upload progression as host-owned state. The library renders attachment status, can create initial `queued` attachment records for composer-originated files, and includes non-removed attachments in composer submission. Your app is still responsible for upload orchestration and for updating attachment status as that work progresses.

There is no official upload client in the package today. Bring your own uploader, then reflect its progress back into the composer.

## Host-owned Uploads

Use `UiComposerAttachment[]` as the contract between your upload system and the composer.

- Let the composer create initial `queued` attachments for picked or dropped files, or add equivalent `queued` records in host-controlled flows.
- Move attachments to `uploading` while your host uploader is in flight.
- Mark attachments `uploaded` once the host has a stable remote result, typically with `remoteUrl`.
- Mark attachments `error` when upload fails and surface an `error` message for retry UI.
- Remove attachments from the send payload by marking them `removed` or filtering removed items out of a controlled list.

The composer does not perform upload network work on its own. It reflects the current `attachments` array and emits attachment list changes through `onAttachmentsChange`.

## Composer Pattern

The current `LexicalComposer` API supports both uncontrolled and controlled attachments, but the recommended integration pattern is a controlled list whose upload progression is managed by the host.

```tsx
import { useState } from "react"
import type { UiComposerAttachment, UiComposerValue } from "uinify"
import { LexicalComposer } from "uinify/composer/lexical"

export function ChatComposer() {
  const [attachments, setAttachments] = useState<UiComposerAttachment[]>([])

  async function retryAttachment(target: UiComposerAttachment) {
    setAttachments((current) =>
      current.map((attachment) =>
        attachment.id === target.id
          ? { ...attachment, status: "uploading", error: undefined, progress: 0 }
          : attachment,
      ),
    )

    try {
      const remoteUrl = await uploadAttachment(target)

      setAttachments((current) =>
        current.map((attachment) =>
          attachment.id === target.id
            ? { ...attachment, status: "uploaded", progress: 100, remoteUrl }
            : attachment,
        ),
      )
    } catch (error) {
      setAttachments((current) =>
        current.map((attachment) =>
          attachment.id === target.id
            ? {
                ...attachment,
                status: "error",
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : attachment,
        ),
      )
    }
  }

  function handleSubmit(value: UiComposerValue) {
    // value.attachments includes every attachment except ones marked `removed`.
    console.log(value)
    setAttachments([])
  }

  return (
    <LexicalComposer
      attachments={attachments}
      onAttachmentsChange={setAttachments}
      onAttachmentRetry={retryAttachment}
      onSubmit={handleSubmit}
      sendPolicy="uploaded-only"
    />
  )
}

async function uploadAttachment(_attachment: UiComposerAttachment) {
  return "https://example.com/uploaded-file"
}
```

Key props in this flow:

- `attachments`: the host-controlled source of truth for the current attachment list.
- `onAttachmentsChange`: called when the composer adds or removes attachments.
- `onAttachmentRetry`: called when the user retries an attachment in `error`.
- `sendPolicy`: set to `"uploaded-only"` to block submit until all non-removed attachments are `uploaded`, or leave the default `"allow-pending"` to submit while uploads are still pending.

## Required States

The current attachment lifecycle surface expects these states:

- `queued`
- `uploading`
- `uploaded`
- `error`
- `removed`

When `sendPolicy` is `"uploaded-only"`, every non-removed attachment must reach `uploaded` before the Send button becomes enabled.
