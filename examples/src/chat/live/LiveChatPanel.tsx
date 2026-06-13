import { useCallback, useMemo, useRef, useState } from "react"
import { createChatRuntime, type UiStreamEvent } from "../../../../src"
import {
  LexicalComposer,
  type UiComposerAttachment,
  type UiComposerValue,
} from "../../../../src/composer/lexical"
import { ChatRoot, MessageList } from "../../../../src/react"
import { readSSEStream } from "../../../../src/sse"
import {
  createImageAttachmentValidator,
  isUploadedImageAttachment,
  readFileAsDataUrl,
  type LiveChatImageAttachment,
} from "../shared/files"
import { createExampleId } from "../shared/ids"
import { LIVE_CHAT_COMMANDS } from "./live-chat-commands"
import type { LiveChatHistoryMessage } from "./live-chat-model"
import { buildLiveChatRequestMessages } from "./live-chat-request"
import "../chat.css"

async function readUiEventStream(response: Response, onEvent: (event: UiStreamEvent) => void) {
  if (!response.body) {
    throw new Error("Chat response did not include a stream.")
  }

  for await (const frame of readSSEStream(response.body)) {
    if (frame.event !== "ui") {
      continue
    }

    onEvent(JSON.parse(frame.data) as UiStreamEvent)
  }
}

function dispatchLocalUserMessage(input: {
  runtime: ReturnType<typeof createChatRuntime>
  messageId: string
  text: string
  images: LiveChatImageAttachment[]
}) {
  input.runtime.dispatch({
    type: "message.started",
    messageId: input.messageId,
    role: "user",
  })

  if (input.text) {
    input.runtime.dispatch({
      type: "part.text.delta",
      messageId: input.messageId,
      partId: `${input.messageId}-text`,
      delta: input.text,
    })
  }

  input.images.forEach((image, index) => {
    input.runtime.dispatch({
      type: "part.image.emitted",
      messageId: input.messageId,
      partId: `${input.messageId}-image-${index}`,
      image: {
        url: image.dataUrl,
        alt: image.name,
        mimeType: image.mimeType,
        sourceAttachmentId: image.id,
      },
    })
  })

  input.runtime.dispatch({
    type: "message.completed",
    messageId: input.messageId,
  })
}

function toUploadedImageAttachment(
  attachment: UiComposerAttachment,
  dataUrl: string,
): LiveChatImageAttachment {
  return {
    id: attachment.id,
    file: attachment.file,
    name: attachment.name,
    mimeType: attachment.mimeType,
    size: attachment.size,
    sourceAttachmentId: attachment.sourceAttachmentId,
    status: "uploaded",
    dataUrl,
  }
}

function readErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function LiveChatPanel() {
  const [runtime] = useState(() => createChatRuntime({ conversationId: "live-multimodal-chat" }))
  const [attachments, setAttachments] = useState<UiComposerAttachment[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const historyRef = useRef<LiveChatHistoryMessage[]>([])
  const uploadStartedRef = useRef(new Set<string>())
  const validateImageAttachments = useMemo(() => createImageAttachmentValidator(), [])

  const uploadQueuedImageAttachments = useCallback((nextAttachments: UiComposerAttachment[]) => {
    for (const attachment of nextAttachments) {
      if (
        attachment.status !== "queued" ||
        attachment.rejection ||
        uploadStartedRef.current.has(attachment.id) ||
        !attachment.file.type.startsWith("image/")
      ) {
        continue
      }

      uploadStartedRef.current.add(attachment.id)
      setAttachments((current) =>
        current.map((item) =>
          item.id === attachment.id
            ? {
                ...item,
                status: "uploading",
                progress: 0,
              }
            : item,
        ),
      )

      void readFileAsDataUrl(attachment.file)
        .then((dataUrl) => {
          setAttachments((current) =>
            current.map((item) =>
              item.id === attachment.id ? toUploadedImageAttachment(item, dataUrl) : item,
            ),
          )
        })
        .catch((nextError) => {
          uploadStartedRef.current.delete(attachment.id)
          setAttachments((current) =>
            current.map((item) =>
              item.id === attachment.id
                ? {
                    ...item,
                    status: "error",
                    error: readErrorMessage(nextError, "Failed to read image attachment."),
                  }
                : item,
            ),
          )
        })
    }
  }, [])

  const handleAttachmentsChange = useCallback(
    (nextAttachments: UiComposerAttachment[]) => {
      const nextIds = new Set(nextAttachments.map((attachment) => attachment.id))

      for (const id of uploadStartedRef.current) {
        if (!nextIds.has(id)) {
          uploadStartedRef.current.delete(id)
        }
      }

      setAttachments(nextAttachments)
      uploadQueuedImageAttachments(nextAttachments)
    },
    [uploadQueuedImageAttachments],
  )

  const handleAttachmentRetry = useCallback(
    (attachment: UiComposerAttachment) => {
      if (attachment.rejection) {
        return
      }

      uploadStartedRef.current.delete(attachment.id)

      const nextAttachments = attachments.map((item) =>
        item.id === attachment.id
          ? {
              ...item,
              status: "queued" as const,
              error: undefined,
              progress: undefined,
            }
          : item,
      )

      setAttachments(nextAttachments)
      uploadQueuedImageAttachments(nextAttachments)
    },
    [attachments, uploadQueuedImageAttachments],
  )

  const handleAttachmentCancel = useCallback((attachment: UiComposerAttachment) => {
    uploadStartedRef.current.delete(attachment.id)
    setAttachments((current) => current.filter((item) => item.id !== attachment.id))
  }, [])

  const submit = useCallback(
    async (value: UiComposerValue) => {
      const text = value.text.trim()
      const images = value.attachments.filter(isUploadedImageAttachment)

      if (isStreaming || (!text && images.length === 0 && value.commands.length === 0)) {
        return
      }

      const userMessageId = createExampleId("user")
      const requestMessages = buildLiveChatRequestMessages({
        history: historyRef.current,
        text: value.text,
        images,
        commands: value.commands,
      })
      let assistantText = ""
      let assistantFailed = false
      let activeAssistantMessageId: string | null = null
      let activeAssistantSettled = false

      setError(null)
      setIsStreaming(true)
      dispatchLocalUserMessage({
        runtime,
        messageId: userMessageId,
        text,
        images,
      })
      historyRef.current = requestMessages

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages: requestMessages }),
        })

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null
          throw new Error(body?.error ?? `Chat request failed with ${response.status}.`)
        }

        await readUiEventStream(response, (event) => {
          runtime.dispatch(event)

          if (event.type === "message.started" && event.role === "assistant") {
            activeAssistantMessageId = event.messageId
            activeAssistantSettled = false
          }

          if (event.type === "part.text.delta" && event.messageId === activeAssistantMessageId) {
            assistantText += event.delta
          }

          if (event.type === "message.completed" && event.messageId === activeAssistantMessageId) {
            activeAssistantSettled = true
          }

          if (event.type === "message.failed" && event.messageId === activeAssistantMessageId) {
            activeAssistantSettled = true
            assistantFailed = true
            setError(event.error)
          }
        })

        if (!assistantFailed) {
          historyRef.current = assistantText
            ? [...requestMessages, { role: "assistant", content: assistantText }]
            : requestMessages
        }
      } catch (nextError) {
        const errorMessage = readErrorMessage(nextError, "Chat request failed.")

        if (activeAssistantMessageId && !activeAssistantSettled) {
          runtime.dispatch({
            type: "message.failed",
            messageId: activeAssistantMessageId,
            error: errorMessage,
          })
        }

        setError(errorMessage)
      } finally {
        setIsStreaming(false)
      }
    },
    [isStreaming, runtime],
  )

  return (
    <section className="chat-route" aria-label="Live multimodal chat">
      <header className="chat-header">
        <div>
          <p>Live model example</p>
          <h2>Live multimodal chat</h2>
        </div>
        <span>{isStreaming ? "Streaming" : "Ready"}</span>
      </header>

      <div className="chat-transcript" data-testid="live-chat-transcript">
        <ChatRoot runtime={runtime}>
          <MessageList style={{ height: "100%", minHeight: "100%" }} />
        </ChatRoot>
      </div>

      <div className="chat-composer">
        {error ? <p className="chat-error">{error}</p> : null}
        <fieldset
          aria-busy={isStreaming}
          disabled={isStreaming}
          style={{ border: 0, margin: 0, padding: 0 }}
        >
          <LexicalComposer
            attachmentAccept="image/*"
            attachments={attachments}
            commands={LIVE_CHAT_COMMANDS}
            onAttachmentCancel={handleAttachmentCancel}
            onAttachmentRetry={handleAttachmentRetry}
            onAttachmentValidation={validateImageAttachments}
            onAttachmentsChange={handleAttachmentsChange}
            onSubmit={(value) => {
              void submit(value)
            }}
            sendPolicy="uploaded-only"
          />
        </fieldset>
      </div>
    </section>
  )
}
