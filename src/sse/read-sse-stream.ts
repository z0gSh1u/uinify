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

    const chunks = buffer.split("\n\n")
    buffer = chunks.pop() ?? ""

    for (const chunk of chunks) {
      const lines = chunk.split("\n")
      const event = lines.find((line) => line.startsWith("event:"))?.replace("event:", "").trim() ?? "message"
      const data = lines
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.replace("data:", "").trim())
        .join("\n")

      yield { event, data }
    }
  }
}
