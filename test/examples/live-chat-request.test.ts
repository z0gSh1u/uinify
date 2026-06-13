import type { UiComposerCommandSelection } from "../../src/composer/lexical"
import type { LiveChatImageAttachment } from "../../examples/src/chat/shared/files"
import type { LiveChatHistoryMessage } from "../../examples/src/chat/live/live-chat-model"
import {
  buildLiveChatRequestMessages,
  createCommandContextText,
} from "../../examples/src/chat/live/live-chat-request"

function createCommandSelection(
  overrides: Partial<UiComposerCommandSelection> = {},
): UiComposerCommandSelection {
  return {
    id: "slash-analyze",
    kind: "slash",
    label: "Analyze image",
    insertText: "/analyze ",
    trigger: "/",
    range: {
      start: 0,
      end: 9,
    },
    description: "Inspect attached images and visual details.",
    ...overrides,
  }
}

function createImageAttachment(
  id: string,
  dataUrl = "data:image/png;base64,cGl4ZWxz",
): LiveChatImageAttachment {
  const file = new File(["pixels"], `${id}.png`, { type: "image/png" })

  return {
    id,
    file,
    name: file.name,
    mimeType: file.type,
    size: file.size,
    status: "uploaded",
    dataUrl,
  }
}

describe("live chat request helpers", () => {
  it("plain text request appends a string user message", () => {
    const history: LiveChatHistoryMessage[] = [{ role: "assistant", content: "Welcome back." }]

    expect(
      buildLiveChatRequestMessages({
        history,
        text: "  Say hello  ",
        images: [],
        commands: [],
      }),
    ).toEqual([
      { role: "assistant", content: "Welcome back." },
      { role: "user", content: "Say hello" },
    ])
  })

  it("selected slash and mention commands add deterministic model context", () => {
    const commands = [
      createCommandSelection(),
      createCommandSelection({
        id: "mention-vision",
        kind: "agent",
        label: "@vision",
        insertText: "@vision ",
        trigger: "@",
        description: "Route the request to the vision assistant.",
        range: {
          start: 9,
          end: 17,
        },
      }),
    ]

    expect(createCommandContextText(commands)).toBe(
      [
        "Selected composer commands:",
        "- Analyze image (slash, trigger /): Inspect attached images and visual details.",
        "- @vision (agent, trigger @): Route the request to the vision assistant.",
      ].join("\n"),
    )

    expect(
      buildLiveChatRequestMessages({
        history: [],
        text: "  What should I notice?  ",
        images: [],
        commands,
      }),
    ).toEqual([
      {
        role: "user",
        content: [
          "Selected composer commands:",
          "- Analyze image (slash, trigger /): Inspect attached images and visual details.",
          "- @vision (agent, trigger @): Route the request to the vision assistant.",
          "",
          "User message:",
          "What should I notice?",
        ].join("\n"),
      },
    ])
  })

  it("image requests append content parts with text first and image_url parts after", () => {
    const firstImage = createImageAttachment("first", "data:image/png;base64,Zmlyc3Q=")
    const secondImage = createImageAttachment("second", "data:image/jpeg;base64,c2Vjb25k")

    expect(
      buildLiveChatRequestMessages({
        history: [{ role: "system", content: "Be concise." }],
        text: "  Compare these  ",
        images: [firstImage, secondImage],
        commands: [createCommandSelection()],
      }),
    ).toEqual([
      { role: "system", content: "Be concise." },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: [
              "Selected composer commands:",
              "- Analyze image (slash, trigger /): Inspect attached images and visual details.",
              "",
              "User message:",
              "Compare these",
            ].join("\n"),
          },
          { type: "image_url", image_url: { url: "data:image/png;base64,Zmlyc3Q=" } },
          { type: "image_url", image_url: { url: "data:image/jpeg;base64,c2Vjb25k" } },
        ],
      },
    ])
  })

  it("image-only request appends valid content parts without an empty text part", () => {
    const image = createImageAttachment("only")

    expect(
      buildLiveChatRequestMessages({
        history: [],
        text: "   ",
        images: [image],
        commands: [],
      }),
    ).toEqual([
      {
        role: "user",
        content: [{ type: "image_url", image_url: { url: "data:image/png;base64,cGl4ZWxz" } }],
      },
    ])
  })

  it("does not mutate input history or images arrays", () => {
    const history: LiveChatHistoryMessage[] = [{ role: "assistant", content: "Previous reply." }]
    const image = createImageAttachment("immutable")
    const images = [image]
    const historySnapshot = [...history]
    const imagesSnapshot = [...images]

    const messages = buildLiveChatRequestMessages({
      history,
      text: "Next",
      images,
      commands: [],
    })

    expect(messages).not.toBe(history)
    expect(history).toEqual(historySnapshot)
    expect(images).toEqual(imagesSnapshot)
    expect(messages[0]).toBe(history[0])
    expect(messages[1]).toEqual({
      role: "user",
      content: [
        { type: "text", text: "Next" },
        { type: "image_url", image_url: { url: image.dataUrl } },
      ],
    })
  })
})
