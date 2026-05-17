export type UiSSEEvent = { event: string; data: string }

export async function* readSSEStream(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<UiSSEEvent, void, undefined> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let lines: string[] = []
  let shouldCancelReader = true

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })

      const parsed = extractLines(buffer)
      buffer = parsed.remainder

      for (const line of parsed.lines) {
        const event = parseEventLines(lines, line)

        if (event) {
          yield event
        }

        if (line.length === 0) {
          lines = []
        } else {
          lines.push(line)
        }
      }
    }

    buffer += decoder.decode()
    const parsed = extractLines(buffer, true)

    for (const line of parsed.lines) {
      const event = parseEventLines(lines, line)

      if (event) {
        yield event
      }

      if (line.length === 0) {
        lines = []
      } else {
        lines.push(line)
      }
    }

    if (parsed.remainder.length > 0) {
      lines.push(parsed.remainder)
    }

    if (lines.length > 0) {
      const event = parseEventChunk(lines.join("\n"))

      if (event) {
        yield event
      }
    }

    shouldCancelReader = false
  } finally {
    if (shouldCancelReader) {
      await reader.cancel()
    }

    reader.releaseLock()
  }
}

function extractLines(buffer: string, flush = false) {
  const lines: string[] = []
  let lineStart = 0
  let index = 0

  while (index < buffer.length) {
    const char = buffer[index]

    if (char === "\n") {
      lines.push(buffer.slice(lineStart, index))
      index += 1
      lineStart = index
      continue
    }

    if (char === "\r") {
      if (index + 1 >= buffer.length && !flush) {
        break
      }

      lines.push(buffer.slice(lineStart, index))
      index += buffer[index + 1] === "\n" ? 2 : 1
      lineStart = index
      continue
    }

    index += 1
  }

  return { lines, remainder: buffer.slice(lineStart) }
}

function parseEventLines(lines: string[], line: string): UiSSEEvent | null {
  if (line.length > 0) {
    return null
  }

  return parseEventChunk(lines.join("\n"))
}

function parseEventChunk(chunk: string): UiSSEEvent | null {
  const lines = chunk.split("\n")

  if (lines.every((line) => line.startsWith(":") || line.length === 0)) {
    return null
  }

  const dataLines = lines.filter((line) => line.startsWith("data:"))

  if (dataLines.length === 0) {
    return null
  }

  const event = lines.find((line) => line.startsWith("event:"))?.slice(6).replace(/^ /, "") ?? "message"
  const data = dataLines
    .map((line) => line.slice(5).replace(/^ /, ""))
    .join("\n")

  return { event, data }
}
