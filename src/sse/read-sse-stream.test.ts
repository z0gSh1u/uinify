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

  it("does not misparse CRLF event boundaries split across chunks", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("event: token\r"))
        controller.enqueue(new TextEncoder().encode("\ndata: {\"delta\":\"hi\"}\r"))
        controller.enqueue(new TextEncoder().encode("\n\r"))
        controller.enqueue(new TextEncoder().encode("\n"))
        controller.close()
      },
    })

    const events = []
    for await (const event of readSSEStream(stream)) {
      events.push(event)
    }

    expect(events).toEqual([{ event: "token", data: '{"delta":"hi"}' }])
  })

  it("parses bare carriage-return framed SSE events", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("event: token\rdata: {\"delta\":\"hi\"}\r\r"))
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

  it("skips comment-only heartbeat chunks", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(": keepalive\n\nevent: token\ndata: {\"delta\":\"hi\"}\n\n"))
        controller.close()
      },
    })

    const events = []
    for await (const event of readSSEStream(stream)) {
      events.push(event)
    }

    expect(events).toEqual([{ event: "token", data: '{"delta":"hi"}' }])
  })

  it("releases the reader when iteration stops early", async () => {
    let cancelReason: unknown

    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new TextEncoder().encode("event: token\ndata: {\"delta\":\"hi\"}\n\n"))
      },
      cancel(reason) {
        cancelReason = reason
      },
    })

    for await (const event of readSSEStream(stream)) {
      expect(event).toEqual({ event: "token", data: '{"delta":"hi"}' })
      break
    }

    expect(stream.locked).toBe(false)
    expect(cancelReason).toBeUndefined()
  })
})
