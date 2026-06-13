import {
  buildOpenAICompatibleChatRequest,
  createOpenAICompatibleChatAdapter,
  resolveChatCompletionsUrl,
  validateChatRequestBody,
} from "../../examples/server/openai-compatible-chat"

describe("OpenAI-compatible chat example adapter", () => {
  it("maps chat completion stream chunks into canonical UI stream events", () => {
    const adapter = createOpenAICompatibleChatAdapter({
      messageId: "assistant-1",
      partId: "assistant-1-text",
    })

    const started = adapter({
      type: "chunk",
      chunk: {
        choices: [{ delta: { role: "assistant" } }],
      },
    })
    const delta = adapter({
      type: "chunk",
      chunk: {
        choices: [{ delta: { content: "Hello" } }],
      },
    })
    const completed = adapter({ type: "done" })

    expect(started).toEqual({
      diagnostics: [],
      events: [
        {
          type: "message.started",
          messageId: "assistant-1",
          role: "assistant",
        },
      ],
    })
    expect(delta).toEqual({
      diagnostics: [],
      events: [
        {
          type: "part.text.delta",
          messageId: "assistant-1",
          partId: "assistant-1-text",
          delta: "Hello",
        },
      ],
    })
    expect(completed).toEqual({
      diagnostics: [],
      events: [
        {
          type: "message.completed",
          messageId: "assistant-1",
        },
      ],
    })
  })

  it("builds a server-side chat completions request without exposing env to the client app", () => {
    const request = buildOpenAICompatibleChatRequest(
      {
        apiKey: "secret-key",
        baseUrl: "https://llm.example.test/v1/",
        model: "example-model",
      },
      {
        messages: [{ role: "user", content: "Say hello" }],
      },
    )

    expect(resolveChatCompletionsUrl("https://llm.example.test/v1/")).toBe(
      "https://llm.example.test/v1/chat/completions",
    )
    expect(request.url).toBe("https://llm.example.test/v1/chat/completions")
    expect(request.init.method).toBe("POST")
    expect(request.init.headers).toMatchObject({
      Authorization: "Bearer secret-key",
      "Content-Type": "application/json",
    })
    expect(JSON.parse(String(request.init.body))).toEqual({
      model: "example-model",
      stream: true,
      messages: [{ role: "user", content: "Say hello" }],
    })
  })

  it("accepts string chat request messages", () => {
    expect(
      validateChatRequestBody({
        messages: [{ role: "user", content: "Say hello" }],
      }),
    ).toBe(true)
  })

  it("accepts multimodal user messages with text and image data URL parts", () => {
    expect(
      validateChatRequestBody({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Describe this image" },
              {
                type: "image_url",
                image_url: { url: "data:image/png;base64,aGVsbG8=" },
              },
            ],
          },
        ],
      }),
    ).toBe(true)
  })

  it.each([
    {
      name: "empty string content",
      body: { messages: [{ role: "user", content: "  " }] },
    },
    {
      name: "empty array content",
      body: { messages: [{ role: "user", content: [] }] },
    },
    {
      name: "sparse messages array",
      body: { messages: new Array(1) },
    },
    {
      name: "sparse content array",
      body: { messages: [{ role: "user", content: new Array(1) }] },
    },
    {
      name: "empty text part",
      body: {
        messages: [{ role: "user", content: [{ type: "text", text: "  " }] }],
      },
    },
    {
      name: "unknown content part type",
      body: {
        messages: [
          {
            role: "user",
            content: [{ type: "audio", url: "data:audio/mp3;base64,aGVsbG8=" }],
          },
        ],
      },
    },
    {
      name: "image URL part without image_url object",
      body: {
        messages: [
          {
            role: "user",
            content: [{ type: "image_url", url: "data:image/png;base64,aGVsbG8=" }],
          },
        ],
      },
    },
    {
      name: "image URL part without url text",
      body: {
        messages: [
          {
            role: "user",
            content: [{ type: "image_url", image_url: { url: "" } }],
          },
        ],
      },
    },
    {
      name: "image URL part with non-image data URL",
      body: {
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: "data:text/plain;base64,aGVsbG8=" },
              },
            ],
          },
        ],
      },
    },
    {
      name: "image URL part without base64 marker",
      body: {
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: "data:image/png,aGVsbG8=" },
              },
            ],
          },
        ],
      },
    },
  ])("rejects invalid chat request body with $name", ({ body }) => {
    expect(validateChatRequestBody(body)).toBe(false)
  })
})
