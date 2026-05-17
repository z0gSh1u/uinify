export type UiSSEEvent = { event: string; data: string }

export async function* readSSEStream(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<UiSSEEvent, void, undefined> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    buffer = normalizeLineEndings(buffer)

    const chunks = buffer.split("\n\n")
    buffer = chunks.pop() ?? ""

    for (const chunk of chunks) {
      const event = parseEventChunk(chunk)

      if (event) {
        yield event
      }
    }
  }

  buffer += decoder.decode()
  buffer = normalizeLineEndings(buffer)

  if (buffer.trim().length > 0) {
    const event = parseEventChunk(buffer)

    if (event) {
      yield event
    }
  }
}

function normalizeLineEndings(value: string) {
  return value.replaceAll("\r\n", "\n").replaceAll("\r", "\n")
}

function parseEventChunk(chunk: string): UiSSEEvent | null {
  const lines = chunk.split("\n")

  if (lines.every((line) => line.startsWith(":") || line.length === 0)) {
    return null
  }

  const event = lines.find((line) => line.startsWith("event:"))?.slice(6).replace(/^ /, "") ?? "message"
  const data = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).replace(/^ /, ""))
    .join("\n")

  return { event, data }
}
