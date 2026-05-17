import { useRef, useState } from "react"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalComposer as BaseComposer } from "@lexical/react/LexicalComposer"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin"
import { $getRoot } from "lexical"
import type { UiComposerAttachment, UiComposerValue } from "../contracts"
import { AttachmentTray } from "../../react/attachment-tray"

export type LexicalComposerProps = {
  onSubmit: (value: UiComposerValue) => void
  initialAttachments?: UiComposerAttachment[]
}

export function LexicalComposer({
  onSubmit,
  initialAttachments = [],
}: LexicalComposerProps) {
  const textRef = useRef("")
  const [attachments, setAttachments] = useState(initialAttachments)

  return (
    <div data-slot="composer">
      <BaseComposer
        initialConfig={{
          namespace: "uinify-composer",
          onError(error) {
            throw error
          },
        }}
      >
        <PlainTextPlugin
          contentEditable={
            <ContentEditable
              aria-label="Message"
              data-slot="composer-editor"
              onInput={(event) => {
                textRef.current = event.currentTarget.textContent ?? ""
              }}
            />
          }
          placeholder={<span>Message</span>}
          ErrorBoundary={({ children }) => <>{children}</>}
        />
        <HistoryPlugin />
        <OnChangePlugin
          onChange={(editorState) => {
            editorState.read(() => {
              textRef.current = $getRoot().getTextContent()
            })
          }}
        />
      </BaseComposer>

      <AttachmentTray
        attachments={attachments}
        onRemove={(id) => {
          setAttachments((items) => items.filter((item) => item.id !== id))
        }}
      />

      <button
        onClick={() =>
          onSubmit({ text: textRef.current, attachments, commands: [], mentions: [] })
        }
        type="button"
      >
        Send
      </button>
    </div>
  )
}
