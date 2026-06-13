import type { UiComposerCommandSelection } from "../../../../src/composer/lexical"
import type { OpenAICompatibleChatContentPart } from "../../../server/openai-compatible-chat"
import type { LiveChatImageAttachment } from "../shared/files"
import type { LiveChatHistoryMessage } from "./live-chat-model"

export function createCommandContextText(commands: UiComposerCommandSelection[]): string {
  const lines = commands.flatMap((command) => {
    const label = normalizeInlineText(command.label)

    if (!label) {
      return []
    }

    const commandText = `- ${label} (${command.kind}, trigger ${command.trigger})`
    const description = normalizeInlineText(command.description ?? "")

    return [description ? `${commandText}: ${description}` : commandText]
  })

  if (lines.length === 0) {
    return ""
  }

  return ["Selected composer commands:", ...lines].join("\n")
}

export function buildLiveChatRequestMessages(input: {
  history: LiveChatHistoryMessage[]
  text: string
  images: LiveChatImageAttachment[]
  commands: UiComposerCommandSelection[]
}): LiveChatHistoryMessage[] {
  const text = createUserTextContent(input.text, input.commands)

  if (input.images.length === 0) {
    return [
      ...input.history,
      {
        role: "user",
        content: text,
      },
    ]
  }

  const content: OpenAICompatibleChatContentPart[] = []

  if (text) {
    content.push({ type: "text", text })
  }

  for (const image of input.images) {
    content.push({
      type: "image_url",
      image_url: {
        url: image.dataUrl,
      },
    })
  }

  return [
    ...input.history,
    {
      role: "user",
      content,
    },
  ]
}

function createUserTextContent(text: string, commands: UiComposerCommandSelection[]): string {
  const trimmedText = text.trim()
  const commandContext = createCommandContextText(commands)

  if (commandContext && trimmedText) {
    return `${commandContext}\n\nUser message:\n${trimmedText}`
  }

  return commandContext || trimmedText
}

function normalizeInlineText(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}
