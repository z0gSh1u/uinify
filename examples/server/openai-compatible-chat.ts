import type { IncomingMessage, ServerResponse } from "node:http"
import { createAdapterRunner, type UiStreamEvent } from "../../src"
import { readSSEStream } from "../../src/sse"
import type { Plugin } from "vite"

export type OpenAICompatibleChatMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

export type OpenAICompatibleChatRequestBody = {
  messages: OpenAICompatibleChatMessage[]
}

export type OpenAICompatibleChatEnv = {
  baseUrl: string
  apiKey: string
  model: string
}

export type OpenAICompatibleChatChunk = {
  choices?: Array<{
    delta?: {
      role?: "assistant"
      content?: string | null
    }
    finish_reason?: string | null
  }>
  error?: {
    message?: string
  }
}

export type OpenAICompatibleChatStreamFrame =
  | {
      type: "chunk"
      chunk: OpenAICompatibleChatChunk
    }
  | {
      type: "done"
    }

export function resolveChatCompletionsUrl(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, "")

  if (trimmed.endsWith("/chat/completions")) {
    return trimmed
  }

  return `${trimmed}/chat/completions`
}

export function buildOpenAICompatibleChatRequest(
  env: OpenAICompatibleChatEnv,
  body: OpenAICompatibleChatRequestBody,
): { url: string; init: RequestInit } {
  return {
    url: resolveChatCompletionsUrl(env.baseUrl),
    init: {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.model,
        stream: true,
        messages: body.messages,
      }),
    },
  }
}

export function createOpenAICompatibleChatAdapter(input: { messageId: string; partId?: string }) {
  const partId = input.partId ?? `${input.messageId}-text`
  let started = false
  let completed = false

  return createAdapterRunner((frame: OpenAICompatibleChatStreamFrame): UiStreamEvent[] => {
    const events: UiStreamEvent[] = []

    if (!started) {
      started = true
      events.push({
        type: "message.started",
        messageId: input.messageId,
        role: "assistant",
      })
    }

    if (completed) {
      return events
    }

    if (frame.type === "done") {
      completed = true
      events.push({
        type: "message.completed",
        messageId: input.messageId,
      })
      return events
    }

    if (frame.chunk.error) {
      completed = true
      events.push({
        type: "message.failed",
        messageId: input.messageId,
        error: frame.chunk.error.message ?? "The model returned an error.",
      })
      return events
    }

    const delta = frame.chunk.choices
      ?.map((choice) => choice.delta?.content)
      .filter((content): content is string => typeof content === "string" && content.length > 0)
      .join("")

    if (delta) {
      events.push({
        type: "part.text.delta",
        messageId: input.messageId,
        partId,
        delta,
      })
    }

    if (frame.chunk.choices?.some((choice) => choice.finish_reason)) {
      completed = true
      events.push({
        type: "message.completed",
        messageId: input.messageId,
      })
    }

    return events
  })
}

export function parseOpenAICompatibleSSEData(data: string): OpenAICompatibleChatStreamFrame | null {
  const trimmed = data.trim()

  if (!trimmed) {
    return null
  }

  if (trimmed === "[DONE]") {
    return { type: "done" }
  }

  return {
    type: "chunk",
    chunk: JSON.parse(trimmed) as OpenAICompatibleChatChunk,
  }
}

export function encodeUiStreamEvent(event: UiStreamEvent) {
  return `event: ui\ndata: ${JSON.stringify(event)}\n\n`
}

function getChatEnv(rawEnv: Record<string, string | undefined>): OpenAICompatibleChatEnv | null {
  const baseUrl = rawEnv.UINIFY_LLM_BASE_URL
  const apiKey = rawEnv.UINIFY_LLM_API_KEY
  const model = rawEnv.UINIFY_LLM_MODEL

  if (!baseUrl || !apiKey || !model) {
    return null
  }

  return { baseUrl, apiKey, model }
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode
  res.setHeader("Content-Type", "application/json; charset=utf-8")
  res.end(JSON.stringify(body))
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk))
  }

  const body = Buffer.concat(chunks).toString("utf8")
  return body ? JSON.parse(body) : null
}

function validateChatRequestBody(body: unknown): OpenAICompatibleChatRequestBody | null {
  if (!body || typeof body !== "object" || !("messages" in body) || !Array.isArray(body.messages)) {
    return null
  }

  const messages = body.messages
    .map((message): OpenAICompatibleChatMessage | null => {
      if (!message || typeof message !== "object") {
        return null
      }

      const role = "role" in message ? message.role : undefined
      const content = "content" in message ? message.content : undefined

      if (
        (role !== "system" && role !== "user" && role !== "assistant") ||
        typeof content !== "string" ||
        content.trim().length === 0
      ) {
        return null
      }

      return { role, content }
    })
    .filter((message): message is OpenAICompatibleChatMessage => message !== null)

  if (messages.length === 0 || messages.length !== body.messages.length) {
    return null
  }

  return { messages }
}

async function streamOpenAICompatibleChat(
  env: OpenAICompatibleChatEnv,
  body: OpenAICompatibleChatRequestBody,
  res: ServerResponse,
) {
  const request = buildOpenAICompatibleChatRequest(env, body)
  const upstream = await fetch(request.url, request.init)

  if (!upstream.ok) {
    sendJson(res, 502, { error: `Model request failed with ${upstream.status}.` })
    return
  }

  if (!upstream.body) {
    sendJson(res, 502, { error: "Model response did not include a stream." })
    return
  }

  const messageId = `assistant-${crypto.randomUUID()}`
  const adapter = createOpenAICompatibleChatAdapter({ messageId })
  let sawDone = false

  res.statusCode = 200
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8")
  res.setHeader("Cache-Control", "no-cache, no-transform")
  res.setHeader("Connection", "keep-alive")
  res.flushHeaders?.()

  for await (const frame of readSSEStream(upstream.body)) {
    const parsed = parseOpenAICompatibleSSEData(frame.data)

    if (!parsed) {
      continue
    }

    if (parsed.type === "done") {
      sawDone = true
    }

    const result = adapter(parsed)

    for (const event of result.events) {
      res.write(encodeUiStreamEvent(event))
    }
  }

  if (!sawDone) {
    const result = adapter({ type: "done" })

    for (const event of result.events) {
      res.write(encodeUiStreamEvent(event))
    }
  }

  res.end()
}

export async function handleOpenAICompatibleChatRequest(
  req: IncomingMessage,
  res: ServerResponse,
  env: Record<string, string | undefined>,
) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Use POST /api/chat." })
    return
  }

  const chatEnv = getChatEnv(env)

  if (!chatEnv) {
    sendJson(res, 500, { error: "Missing UINIFY_LLM_BASE_URL, UINIFY_LLM_API_KEY, or UINIFY_LLM_MODEL." })
    return
  }

  try {
    const body = validateChatRequestBody(await readJsonBody(req))

    if (!body) {
      sendJson(res, 400, { error: "Request body must include non-empty chat messages." })
      return
    }

    await streamOpenAICompatibleChat(chatEnv, body, res)
  } catch (error) {
    if (!res.headersSent) {
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : "Chat request failed.",
      })
      return
    }

    res.end()
  }
}

export function createOpenAICompatibleChatPlugin(env: Record<string, string | undefined>): Plugin {
  return {
    name: "uinify-openai-compatible-chat",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost")

        if (url.pathname !== "/api/chat") {
          next()
          return
        }

        void handleOpenAICompatibleChatRequest(req, res, env)
      })
    },
  }
}
