import { useEffect, useRef, useState } from "react"
import { createChatRuntime, type UiComposerAttachment, type UiComposerValue } from "../../src"
import { LexicalComposer } from "../../src/composer/lexical"
import { ChatRoot, MessageList } from "../../src/react"

export function MultimodalTemplate() {
  const objectUrls = useRef(new Set<string>())
  const [runtime] = useState(() => {
    const next = createChatRuntime({ conversationId: "template-multimodal" })

    next.dispatch({ type: "message.started", messageId: "multimodal-assistant", role: "assistant" })
    next.dispatch({
      type: "part.text.delta",
      messageId: "multimodal-assistant",
      partId: "multimodal-assistant-text",
      delta: "Paste or attach an image, add a prompt, and the host will map it into a transcript image part.",
    })
    next.dispatch({ type: "message.completed", messageId: "multimodal-assistant" })

    return next
  })

  useEffect(() => {
    return () => {
      for (const url of objectUrls.current) {
        if (typeof URL.revokeObjectURL === "function") {
          URL.revokeObjectURL(url)
        }
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

    const assistantMessageId = `multimodal-assistant-${Date.now()}`

    runtime.dispatch({ type: "message.started", messageId: assistantMessageId, role: "assistant" })
    runtime.dispatch({
      type: "part.text.delta",
      messageId: assistantMessageId,
      partId: `${assistantMessageId}-text`,
      delta: imageAttachment
        ? `Rendered ${imageAttachment.name} through the canonical image part contract.`
        : "Submitted a text-only message; attach an image to exercise the multimodal path.",
    })
    runtime.dispatch({ type: "message.completed", messageId: assistantMessageId })
  }

  return (
    <section>
      <h2>Multimodal image template</h2>
      <p>Host code maps image attachments into canonical transcript image events.</p>
      <ChatRoot runtime={runtime}>
        <MessageList />
      </ChatRoot>
      <LexicalComposer attachmentAccept="image/*" onSubmit={handleSubmit} />
    </section>
  )
}

function readAttachmentMimeType(attachment: UiComposerAttachment) {
  return attachment.mimeType ?? attachment.file.type
}
