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
  UiComposerCommand,
  UiComposerCommandSelection,
  UiComposerAttachmentValidationResult,
  UiComposerValue,
} from "../contracts"
import { AttachmentTray } from "../../react/attachment-tray"
import { createAttachmentHandlers } from "./plugins/attachment-plugin"
import { CommandPlugin, readCommandTrigger } from "./plugins/command-plugin"

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
  attachments?: UiComposerAttachment[]
  onAttachmentsChange?: (attachments: UiComposerAttachment[]) => void
  onAttachmentRetry?: (attachment: UiComposerAttachment) => void
  onAttachmentValidation?: (attachments: UiComposerAttachment[]) => UiComposerAttachmentValidationResult[]
  onAttachmentCancel?: (attachment: UiComposerAttachment) => void
  sendPolicy?: "allow-pending" | "uploaded-only"
  commands?: UiComposerCommand[]
}

export function LexicalComposer({
  onSubmit,
  initialAttachments = [],
  attachments: controlledAttachments,
  onAttachmentsChange,
  onAttachmentRetry,
  onAttachmentValidation,
  onAttachmentCancel,
  sendPolicy = "allow-pending",
  commands = [],
}: LexicalComposerProps) {
  const [text, setText] = useState("")
  const editorRef = useRef<LexicalEditor | null>(null)
  const lastTextRef = useRef("")
  const lastActiveTokenStateRef = useRef<ActiveTokenState>({ token: "", range: null })
  const [uncontrolledAttachments, setUncontrolledAttachments] = useState(initialAttachments)
  const [activeToken, setActiveToken] = useState("")
  const [selectedCommands, setSelectedCommands] = useState<UiComposerCommandSelection[]>([])
  const attachments = controlledAttachments ?? uncontrolledAttachments
  const setComposerAttachments = (
    nextAttachments:
      | UiComposerAttachment[]
      | ((current: UiComposerAttachment[]) => UiComposerAttachment[]),
  ) => {
    if (controlledAttachments === undefined) {
      setUncontrolledAttachments((current) => {
        const resolvedNextAttachments =
          typeof nextAttachments === "function" ? nextAttachments(current) : nextAttachments

        onAttachmentsChange?.(resolvedNextAttachments)
        return resolvedNextAttachments
      })
      return
    }

    const resolvedNextAttachments =
      typeof nextAttachments === "function" ? nextAttachments(controlledAttachments) : nextAttachments

    onAttachmentsChange?.(resolvedNextAttachments)
  }
  const updateAttachments = (updater: (current: UiComposerAttachment[]) => UiComposerAttachment[]) => {
    setComposerAttachments(updater)
  }
  const updateTextFromEditor = (nextText: string) => {
    const previousText = lastTextRef.current

    lastTextRef.current = nextText
    setText(nextText)

    if (previousText !== nextText) {
      setSelectedCommands((current) => reconcileCommandSelections(current, previousText, nextText))
    }
  }
  const attachmentHandlers = useMemo(
    () =>
      createAttachmentHandlers(
        (items) => updateAttachments((current) => [...current, ...items]),
        onAttachmentValidation,
      ),
    [onAttachmentValidation, controlledAttachments, onAttachmentsChange],
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
    lastTextRef.current = nextText
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

  const insertCommand = (command: UiComposerCommand) => {
    if (command.disabledReason) {
      return
    }

    const state = getActiveTokenState()
    const range = state.range ?? lastActiveTokenStateRef.current.range
    const trigger = readCommandTrigger(command)

    if (!range || !trigger) {
      return
    }

    const previousText = readEditorText(editorRef.current) ?? text
    const replacementRange = readEffectiveReplacementRange(previousText, range, command.insertText)
    const nextText = updateEditorToken(command.insertText)
    const resolvedNextText = nextText ?? replaceTokenInSnapshotAtRange(previousText, range, command.insertText)
    const delta = resolvedNextText.length - previousText.length

    lastTextRef.current = resolvedNextText

    if (nextText !== null) {
      setText(nextText)
    } else {
      setEditorText(resolvedNextText)
    }

    setSelectedCommands((current) => [
      ...current.flatMap((selection) => {
        if (selection.range.end <= replacementRange.start) {
          return [selection]
        }

        if (selection.range.start >= replacementRange.end) {
          return [shiftCommandSelection(selection, delta)]
        }

        return []
      }),
      createCommandSelection(command, trigger, replacementRange.start),
    ])
  }

  const resetComposer = () => {
    lastTextRef.current = ""
    setText("")
    setSelectedCommands([])
    setComposerAttachments([])
    editorRef.current?.update(() => {
      const root = $getRoot()
      root.clear()
      root.append($createParagraphNode())
    })
    editorRef.current?.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined)
  }

  const submittableAttachments = attachments.filter(
    (attachment) => attachment.status !== "removed" && !attachment.rejection,
  )
  const submitBlockedReason = readSubmitBlockedReason(submittableAttachments, sendPolicy)

  const isSubmitBlocked = submitBlockedReason !== null

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
                updateTextFromEditor(event.currentTarget.textContent ?? "")
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
              updateTextFromEditor($getRoot().getTextContent())
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

      <CommandPlugin commands={commands} onSelect={insertCommand} query={activeToken} />

      <AttachmentTray
        attachments={attachments}
        onRetry={onAttachmentRetry}
        onRemove={(id) => {
          const attachment = attachments.find((item) => item.id === id)

          if (attachment?.status === "uploading" && onAttachmentCancel) {
            onAttachmentCancel?.(attachment)
            return
          }

          updateAttachments((items) => items.filter((item) => item.id !== id))
        }}
      />

      <button
        data-send-blocked-reason={submitBlockedReason ?? undefined}
        disabled={isSubmitBlocked}
        onClick={() => {
          if (isSubmitBlocked) {
            return
          }

          const submitCommands = selectedCommands.filter(
            (selection) => text.slice(selection.range.start, selection.range.end) === selection.insertText,
          )

          onSubmit({
            text,
            attachments: submittableAttachments,
            commands: submitCommands,
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

function readEditorText(editor: LexicalEditor | null) {
  let text: string | null = null

  editor?.getEditorState().read(() => {
    text = $getRoot().getTextContent()
  })

  return text
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

function createCommandSelection(
  command: UiComposerCommand,
  trigger: "/" | "@",
  start: number,
): UiComposerCommandSelection {
  return {
    id: command.id,
    kind: command.kind,
    label: command.label,
    insertText: command.insertText,
    trigger,
    range: {
      start,
      end: start + command.insertText.length,
    },
    ...(command.description ? { description: command.description } : {}),
    ...(command.group ? { group: command.group } : {}),
    ...(command.metadata ? { metadata: command.metadata } : {}),
  }
}

function readEffectiveReplacementRange(
  text: string,
  range: ActiveTokenRange,
  insertText: string,
): ActiveTokenRange {
  const consumesFollowingWhitespace = insertText.endsWith(" ") && /^\s/.test(text.slice(range.end))

  return {
    start: range.start,
    end: consumesFollowingWhitespace ? range.end + 1 : range.end,
  }
}

function shiftCommandSelection(
  selection: UiComposerCommandSelection,
  delta: number,
): UiComposerCommandSelection {
  return {
    ...selection,
    range: {
      start: selection.range.start + delta,
      end: selection.range.end + delta,
    },
  }
}

function reconcileCommandSelections(
  selections: UiComposerCommandSelection[],
  previousText: string,
  nextText: string,
) {
  const change = readTextChange(previousText, nextText)

  return selections.flatMap((selection) => {
    if (previousText.slice(selection.range.start, selection.range.end) !== selection.insertText) {
      return []
    }

    if (!change || change.start >= selection.range.end) {
      return [selection]
    }

    if (change.end <= selection.range.start) {
      return [shiftCommandSelection(selection, change.delta)]
    }

    return []
  })
}

function readTextChange(previousText: string, nextText: string) {
  if (previousText === nextText) {
    return null
  }

  let start = 0

  while (
    start < previousText.length &&
    start < nextText.length &&
    previousText[start] === nextText[start]
  ) {
    start += 1
  }

  let previousEnd = previousText.length
  let nextEnd = nextText.length

  while (
    previousEnd > start &&
    nextEnd > start &&
    previousText[previousEnd - 1] === nextText[nextEnd - 1]
  ) {
    previousEnd -= 1
    nextEnd -= 1
  }

  return {
    start,
    end: previousEnd,
    delta: nextText.length - previousText.length,
  }
}

function readSubmitBlockedReason(
  attachments: UiComposerAttachment[],
  sendPolicy: "allow-pending" | "uploaded-only",
) {
  if (sendPolicy !== "uploaded-only") {
    return null
  }

  if (attachments.some((attachment) => attachment.status === "uploading")) {
    return "attachments-uploading"
  }

  if (attachments.some((attachment) => attachment.status !== "uploaded")) {
    return "attachments-not-uploaded"
  }

  return null
}

function EditorRefPlugin({ onReady }: { onReady: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    onReady(editor)
  }, [editor, onReady])

  return null
}
