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
})
