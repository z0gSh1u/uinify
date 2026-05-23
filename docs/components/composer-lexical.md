# Lexical Composer

`uinify/composer/lexical` provides the default rich composer surface for text entry plus host-controlled attachments and commands.

## Main Export

```tsx
import { LexicalComposer } from "uinify/composer/lexical"
```

Use it as a controlled component around your app's submission flow:

```tsx
import { useState } from "react"
import type { UiComposerAttachment, UiComposerValue } from "uinify"
import { LexicalComposer } from "uinify/composer/lexical"

export function Composer() {
  const [attachments, setAttachments] = useState<UiComposerAttachment[]>([])

  function handleSubmit(value: UiComposerValue) {
    console.log(value.text, attachments)
    setAttachments([])
  }

  return (
    <LexicalComposer
      attachments={attachments}
      onAttachmentsChange={setAttachments}
      onSubmit={handleSubmit}
      sendPolicy="uploaded-only"
    />
  )
}
```

## Host-Owned Responsibilities

The composer does not upload files, call your API, or retry failed network work.

Your host should own:

- attachment validation and upload lifecycle
- final submit behavior
- cancel and retry semantics
- mentions, slash commands, and any app-specific policies

## Related Exports

The subpath also exposes helpers such as attachment utilities and plugin surfaces for mentions or slash commands. Reach for those only when the default composer behavior is close but not complete.
