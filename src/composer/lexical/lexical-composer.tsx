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
  $isTextNode,
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
  const lastActiveTokenStateRef = useRef<ActiveTokenState>({ token: "", range: null })
  const [attachments, setAttachments] = useState(initialAttachments)
  const [activeToken, setActiveToken] = useState("")
  const attachmentHandlers = useMemo(
    () => createAttachmentHandlers((items) => setAttachments((current) => [...current, ...items])),
    [],
  )

  const getActiveTokenState = (): ActiveTokenState => readActiveTokenState(editorRef.current)

  const replaceActiveToken = (insertText: string) => {
    const state = getActiveTokenState()
    const range = state.range ?? lastActiveTokenStateRef.current.range

    if (!range) {
      return replaceTokenInSnapshot(text, state.token || activeToken || lastActiveTokenStateRef.current.token, insertText)
    }

    return replaceTokenInSnapshotAtRange(text, range, insertText)
  }

  const updateEditorToken = (insertText: string) => {
    let nextText: string | null = null

    editorRef.current?.update(() => {
      const selection = $getSelection()

      if (!$isRangeSelection(selection) || !selection.isCollapsed() || selection.anchor.type !== "text") {
        return
      }

      const anchorNode = selection.anchor.getNode()

      if (!$isTextNode(anchorNode)) {
        return
      }

      const parent = anchorNode.getParent()
      const root = $getRoot()

      if (!parent || parent.getParent() !== root) {
        return
      }

      const paragraphText = parent.getTextContent()
      let paragraphTextOffset = 0

      for (const sibling of parent.getChildren()) {
        if (sibling.getKey() === anchorNode.getKey()) {
          paragraphTextOffset += selection.anchor.offset
          break
        }

        paragraphTextOffset += sibling.getTextContentSize()
      }

      const tokenStart = paragraphText.slice(0, paragraphTextOffset).search(/(?:^|\s)[\/@]\S*$/)

      if (tokenStart === -1) {
        return
      }

      const prefix = paragraphText[tokenStart]
      const actualStart = prefix === "/" || prefix === "@" ? tokenStart : tokenStart + 1
      let actualEnd = paragraphTextOffset

      while (actualEnd < paragraphText.length && !/\s/.test(paragraphText[actualEnd] ?? "")) {
        actualEnd += 1
      }

      const nextToken = paragraphText.slice(actualStart, actualEnd)

      if (!nextToken.startsWith("/") && !nextToken.startsWith("@")) {
        return
      }

      const nextParagraphText =
        paragraphText.slice(0, actualStart) +
        insertText +
        (insertText.endsWith(" ") && /^\s/.test(paragraphText.slice(actualEnd))
          ? paragraphText.slice(actualEnd).replace(/^\s+/, "")
          : paragraphText.slice(actualEnd))

      parent.clear()
      parent.append($createTextNode(nextParagraphText))
      const lastChild = parent.getLastChild()

      if ($isTextNode(lastChild)) {
        lastChild.select(actualStart + insertText.length, actualStart + insertText.length)
      }

      nextText = root.getTextContent()
    })

    return nextText
  }

  const setEditorText = (nextText: string) => {
    setText(nextText)
    editorRef.current?.update(() => {
      const root = $getRoot()
      root.clear()

      const paragraphs = nextText.split("\n\n")

      for (const paragraphText of paragraphs) {
        root.append($createParagraphNode().append($createTextNode(paragraphText)))
      }
    })
  }

  const insertChoice = (choice: UiComposerChoice) => {
    const nextText = updateEditorToken(choice.insertText)

    if (nextText !== null) {
      setText(nextText)
      return
    }

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
        <ActiveTokenPlugin
          onChange={(state) => {
            setActiveToken(state.token)

            if (state.token.length > 0 && state.range) {
              lastActiveTokenStateRef.current = state
            }
          }}
        />
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
          const { commands: submitCommands, mentions: submitMentions } = deriveSubmitMetadata(
            text,
            slashCommands,
            mentions,
          )

          onSubmit({
            text,
            attachments,
            commands: submitCommands,
            mentions: submitMentions,
          })
          resetComposer()
        }}
        type="button"
      >
        Send
      </button>
    </div>
  )
}

function ActiveTokenPlugin({ onChange }: { onChange: (state: ActiveTokenState) => void }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        onChange(readActiveTokenState(editor))
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
    const root = $getRoot()

    if (!parent || parent.getParent() !== root) {
      return
    }

    const paragraphIndex = parent.getIndexWithinParent()
    let paragraphTextOffset = 0

    for (const sibling of parent.getChildren()) {
      if (sibling.getKey() === anchorNode.getKey()) {
        paragraphTextOffset += selection.anchor.offset
        break
      }

      paragraphTextOffset += sibling.getTextContentSize()
    }

    const paragraphText = parent.getTextContent()
    const tokenStart = paragraphText.slice(0, paragraphTextOffset).search(/(?:^|\s)[\/@]\S*$/)

    if (tokenStart === -1) {
      return
    }

    const prefix = paragraphText[tokenStart]
    const actualStart = prefix === "/" || prefix === "@" ? tokenStart : tokenStart + 1
    let actualEnd = paragraphTextOffset

    while (actualEnd < paragraphText.length && !/\s/.test(paragraphText[actualEnd] ?? "")) {
      actualEnd += 1
    }

    const nextToken = paragraphText.slice(actualStart, actualEnd)

    if (!nextToken.startsWith("/") && !nextToken.startsWith("@")) {
      return
    }

    let documentOffset = 0

    for (let index = 0; index < paragraphIndex; index += 1) {
      const previousParagraph = root.getChildAtIndex(index)

      if (!previousParagraph) {
        break
      }

      documentOffset += previousParagraph.getTextContentSize() + 2
    }

    token = nextToken
    range = {
      start: documentOffset + actualStart,
      end: documentOffset + actualEnd,
    }
  })

  return { token, range }
}

function replaceTokenInSnapshot(text: string, token: string, insertText: string) {
  return replaceTokenInSnapshotAtRange(text, findFallbackRange(text, token), insertText)
}

function replaceTokenInSnapshotAtRange(
  text: string,
  range: ActiveTokenRange | null,
  insertText: string,
) {
  if (!range) {
    return insertText
  }

  const prefix = text.slice(0, range.start)
  const suffix = text.slice(range.end)
  const normalizedSuffix = insertText.endsWith(" ") && /^\s/.test(suffix) ? suffix.replace(/^\s+/, "") : suffix

  return `${prefix}${insertText}${normalizedSuffix}`
}

function findFallbackRange(text: string, token: string): ActiveTokenRange | null {
  if (token.length === 0) {
    return null
  }

  const tokenIndex = text.lastIndexOf(token)

  if (tokenIndex === -1) {
    return null
  }

  return {
    start: tokenIndex,
    end: tokenIndex + token.length,
  }
}

function deriveSubmitMetadata(text: string, slashCommands: UiComposerChoice[], mentions: UiComposerChoice[]) {
  return {
    commands: deriveChoiceIdsFromText(text, slashCommands),
    mentions: deriveChoiceIdsFromText(text, mentions),
  }
}

function deriveChoiceIdsFromText(text: string, items: UiComposerChoice[]) {
  const choicesByToken = new Map<string, string[]>()

  for (const item of items) {
    const token = readChoiceToken(item)

    if (!token) {
      continue
    }

    choicesByToken.set(token, [...(choicesByToken.get(token) ?? []), item.id])
  }

  if (choicesByToken.size === 0) {
    return []
  }

  const matches = text.match(/(?:^|\s)([\/@]\S*)/g) ?? []

  return matches.flatMap((match) => choicesByToken.get(match.trim()) ?? [])
}

function readChoiceToken(choice: UiComposerChoice) {
  return choice.insertText.trim().match(/^[\/@]\S*/)?.[0] ?? null
}

function EditorRefPlugin({ onReady }: { onReady: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    onReady(editor)
  }, [editor, onReady])

  return null
}
