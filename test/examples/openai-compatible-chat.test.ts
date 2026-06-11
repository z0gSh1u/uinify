import {
  buildOpenAICompatibleChatRequest,
  createOpenAICompatibleChatAdapter,
  resolveChatCompletionsUrl,
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
})
