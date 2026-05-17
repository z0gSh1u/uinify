import { readSSEStream } from "./read-sse-stream"

export async function* createSSEStream(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const response = await fetch(input, init)

  if (!response.ok) {
    throw new Error(`SSE request failed with ${response.status}`)
  }

  if (!response.body) {
    throw new Error("SSE response body is missing")
  }

  yield* readSSEStream(response.body)
}
