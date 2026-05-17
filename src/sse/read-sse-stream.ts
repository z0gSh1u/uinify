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
    buffer = buffer.replaceAll("\r\n", "\n")

    const chunks = buffer.split("\n\n")
    buffer = chunks.pop() ?? ""

    for (const chunk of chunks) {
      yield parseEventChunk(chunk)
    }
  }

  buffer += decoder.decode()
  buffer = buffer.replaceAll("\r\n", "\n")

  if (buffer.trim().length > 0) {
    yield parseEventChunk(buffer)
  }
}

function parseEventChunk(chunk: string): UiSSEEvent {
  const lines = chunk.split("\n")
  const event = lines.find((line) => line.startsWith("event:"))?.slice(6).replace(/^ /, "") ?? "message"
  const data = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).replace(/^ /, ""))
    .join("\n")

  return { event, data }
}
