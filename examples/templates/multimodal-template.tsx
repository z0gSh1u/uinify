import { useEffect, useRef, useState } from "react"
import { createChatRuntime, type UiComposerAttachment, type UiComposerValue } from "../../src"
import { LexicalComposer } from "../../src/composer/lexical"
import { ChatRoot, MessageList } from "../../src/react"

export function MultimodalTemplate() {
  const objectUrls = useRef(new Set<string>())
  const [runtime] = useState(() => createChatRuntime({ conversationId: "template-multimodal" }))

  useEffect(() => {
    return () => {
      for (const url of objectUrls.current) {
        URL.revokeObjectURL(url)
      }

      objectUrls.current.clear()
    }
  }, [])

  function createLocalImageUrl(attachment: UiComposerAttachment) {
    if (typeof URL.createObjectURL !== "function") {
      return `about:blank#${attachment.id}`
    }

    const url = URL.createObjectURL(attachment.file)
    objectUrls.current.add(url)
    return url
  }

  function handleSubmit(value: UiComposerValue) {
    const imageAttachment = value.attachments.find((attachment) =>
      readAttachmentMimeType(attachment).startsWith("image/"),
    )
    const messageId = `multimodal-user-${Date.now()}`

    runtime.dispatch({ type: "message.started", messageId, role: "user" })

    if (value.text.trim().length > 0) {
      runtime.dispatch({
        type: "part.text.delta",
        messageId,
        partId: `${messageId}-text`,
        delta: value.text,
      })
    }

    if (imageAttachment) {
      runtime.dispatch({
        type: "part.image.emitted",
        messageId,
        partId: imageAttachment.id,
        image: {
          url: createLocalImageUrl(imageAttachment),
          alt: imageAttachment.name,
          mimeType: readAttachmentMimeType(imageAttachment),
          sourceAttachmentId: imageAttachment.id,
        },
      })
    }

    runtime.dispatch({ type: "message.completed", messageId })
  }

  return (
    <section>
      <h2>Multimodal image template</h2>
      <p>Host code maps image attachments into canonical transcript image events.</p>
      <ChatRoot runtime={runtime}>
        <MessageList />
      </ChatRoot>
      <LexicalComposer onSubmit={handleSubmit} />
    </section>
  )
}

function readAttachmentMimeType(attachment: UiComposerAttachment) {
  return attachment.mimeType ?? attachment.file.type
}
