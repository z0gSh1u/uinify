import { useEffect, useRef, useState } from "react"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalComposer as BaseComposer } from "@lexical/react/LexicalComposer"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin"
import {
  $createParagraphNode,
  $getRoot,
  CLEAR_HISTORY_COMMAND,
  type LexicalEditor,
} from "lexical"
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
  const editorRef = useRef<LexicalEditor | null>(null)
  const [attachments, setAttachments] = useState(initialAttachments)

  const resetComposer = () => {
    textRef.current = ""
    setAttachments([])
    editorRef.current?.update(() => {
      const root = $getRoot()
      root.clear()
      root.append($createParagraphNode())
    })
    editorRef.current?.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined)
  }

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
        <EditorRefPlugin
          onReady={(editor) => {
            editorRef.current = editor
          }}
        />
        <PlainTextPlugin
          contentEditable={
            <ContentEditable
              ariaLabel="Message"
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
        onClick={() => {
          onSubmit({ text: textRef.current, attachments, commands: [], mentions: [] })
          resetComposer()
        }}
        type="button"
      >
        Send
      </button>
    </div>
  )
}

function EditorRefPlugin({ onReady }: { onReady: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    onReady(editor)
  }, [editor, onReady])

  return null
}
