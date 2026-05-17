import { useEffect, useMemo, useRef, useState } from "react"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalComposer as BaseComposer } from "@lexical/react/LexicalComposer"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  CLEAR_HISTORY_COMMAND,
  type LexicalEditor,
} from "lexical"
import type {
  UiComposerAttachment,
  UiComposerChoice,
  UiComposerValue,
} from "../contracts"
import { AttachmentTray } from "../../react/attachment-tray"
import { createAttachmentHandlers } from "./plugins/attachment-plugin"
import { MentionPlugin } from "./plugins/mention-plugin"
import { SlashCommandPlugin } from "./plugins/slash-command-plugin"

type ActiveTokenRange = {
  start: number
  end: number
}

type ActiveTokenState = {
  token: string
  range: ActiveTokenRange | null
}

export type LexicalComposerProps = {
  onSubmit: (value: UiComposerValue) => void
  initialAttachments?: UiComposerAttachment[]
  slashCommands?: UiComposerChoice[]
  mentions?: UiComposerChoice[]
}

export function LexicalComposer({
  onSubmit,
  initialAttachments = [],
  slashCommands = [],
  mentions = [],
}: LexicalComposerProps) {
  const [text, setText] = useState("")
  const editorRef = useRef<LexicalEditor | null>(null)
  const [attachments, setAttachments] = useState(initialAttachments)
  const [activeToken, setActiveToken] = useState("")
  const attachmentHandlers = useMemo(
    () => createAttachmentHandlers((items) => setAttachments((current) => [...current, ...items])),
    [],
  )

  const getActiveTokenState = (): ActiveTokenState => readActiveTokenState(editorRef.current)

  const replaceActiveToken = (insertText: string) => {
    const state = getActiveTokenState()
    const range = state.range

    if (!range) {
      return insertText
    }

    const prefix = text.slice(0, range.start)
    const suffix = text.slice(range.end)
    const normalizedSuffix =
      insertText.endsWith(" ") && /^\s/.test(suffix) ? suffix.replace(/^\s+/, "") : suffix

    return `${prefix}${insertText}${normalizedSuffix}`
  }

  const setEditorText = (nextText: string) => {
    setText(nextText)
    editorRef.current?.update(() => {
      const root = $getRoot()
      root.clear()
      root.append($createParagraphNode().append($createTextNode(nextText)))
    })
  }

  const insertChoice = (choice: UiComposerChoice) => {
    setEditorText(replaceActiveToken(choice.insertText))
  }

  const resetComposer = () => {
    setText("")
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
                setText(event.currentTarget.textContent ?? "")
              }}
              onDrop={attachmentHandlers.onDrop}
              onPaste={attachmentHandlers.onPaste}
            />
          }
          placeholder={<span>Message</span>}
          ErrorBoundary={({ children }) => <>{children}</>}
        />
        <HistoryPlugin />
        <OnChangePlugin
          onChange={(editorState) => {
            editorState.read(() => {
              setText($getRoot().getTextContent())
            })
          }}
        />
        <ActiveTokenPlugin onChange={setActiveToken} />
      </BaseComposer>

      <SlashCommandPlugin items={slashCommands} onSelect={insertChoice} query={activeToken} />
      <MentionPlugin items={mentions} onSelect={insertChoice} query={activeToken} />

      <AttachmentTray
        attachments={attachments}
        onRemove={(id) => {
          setAttachments((items) => items.filter((item) => item.id !== id))
        }}
      />

      <button
        onClick={() => {
          onSubmit({ text, attachments, commands: [], mentions: [] })
          resetComposer()
        }}
        type="button"
      >
        Send
      </button>
    </div>
  )
}

function ActiveTokenPlugin({ onChange }: { onChange: (token: string) => void }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        onChange(readActiveTokenState(editor).token)
      })
    })
  }, [editor, onChange])

  return null
}

function readActiveTokenState(editor: LexicalEditor | null): ActiveTokenState {
  let token = ""
  let range: ActiveTokenRange | null = null

  editor?.getEditorState().read(() => {
    const selection = $getSelection()

    if (!$isRangeSelection(selection) || !selection.isCollapsed() || selection.anchor.type !== "text") {
      return
    }

    const anchorNode = selection.anchor.getNode()
    const parent = anchorNode.getParent()

    if (!parent) {
      return
    }

    const siblings = parent.getChildren()
    let absoluteOffset = 0

    for (const sibling of siblings) {
      if (sibling.getKey() === anchorNode.getKey()) {
        absoluteOffset += selection.anchor.offset
        break
      }

      absoluteOffset += sibling.getTextContentSize()
    }

    const fullText = parent.getTextContent()
    const tokenStart = fullText.slice(0, absoluteOffset).search(/(?:^|\s)[\/@]\S*$/)

    if (tokenStart === -1) {
      return
    }

    const prefix = fullText[tokenStart]
    const actualStart = prefix === "/" || prefix === "@" ? tokenStart : tokenStart + 1
    let actualEnd = absoluteOffset

    while (actualEnd < fullText.length && !/\s/.test(fullText[actualEnd] ?? "")) {
      actualEnd += 1
    }

    const nextToken = fullText.slice(actualStart, actualEnd)

    if (!nextToken.startsWith("/") && !nextToken.startsWith("@")) {
      return
    }

    token = nextToken
    range = { start: actualStart, end: actualEnd }
  })

  return { token, range }
}

function EditorRefPlugin({ onReady }: { onReady: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    onReady(editor)
  }, [editor, onReady])

  return null
}
