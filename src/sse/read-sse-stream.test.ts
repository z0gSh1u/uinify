import { describe, expect, it } from "vitest"
import { readSSEStream } from "./read-sse-stream"

describe("readSSEStream", () => {
  it("parses event and data fields from a ReadableStream", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("event: token\ndata: {\"delta\":\"hi\"}\n\n"))
        controller.close()
      },
    })

    const events = []
    for await (const event of readSSEStream(stream)) {
      events.push(event)
    }

    expect(events).toEqual([{ event: "token", data: '{"delta":"hi"}' }])
  })

  it("parses CRLF-framed SSE events", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("event: token\r\ndata: {\"delta\":\"hi\"}\r\n\r\n"))
        controller.close()
      },
    })

    const events = []
    for await (const event of readSSEStream(stream)) {
      events.push(event)
    }

    expect(events).toEqual([{ event: "token", data: '{"delta":"hi"}' }])
  })

  it("preserves meaningful whitespace in field values", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("event:  token \ndata:   keep trailing  \n\n"))
        controller.close()
      },
    })

    const events = []
    for await (const event of readSSEStream(stream)) {
      events.push(event)
    }

    expect(events).toEqual([{ event: " token ", data: "  keep trailing  " }])
  })

  it("flushes the final buffered event when the stream ends without a trailing blank line", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("event: token\ndata: {\"delta\":\"hi\"}"))
        controller.close()
      },
    })

    const events = []
    for await (const event of readSSEStream(stream)) {
      events.push(event)
    }

    expect(events).toEqual([{ event: "token", data: '{"delta":"hi"}' }])
  })
})
