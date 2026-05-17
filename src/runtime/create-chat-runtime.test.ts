import { describe, expect, it } from "vitest"
import { createChatRuntime } from "./create-chat-runtime"

describe("createChatRuntime", () => {
  it("starts with an empty linear transcript", () => {
    const runtime = createChatRuntime({ conversationId: "demo" })

    expect(runtime.getState()).toEqual({
      conversationId: "demo",
      messages: [],
      status: "idle",
      error: null,
      warnings: [],
    })

    runtime.setState({
      ...runtime.getState(),
      status: "streaming",
    })

    expect(runtime.getState().status).toBe("streaming")
  })

  it("accepts only typed state updates", () => {
    const runtime = createChatRuntime({ conversationId: "demo" })

    runtime.setState((current: ReturnType<typeof runtime.getState>) => ({
      ...current,
      status: "streaming",
    }))

    const invalidState: Parameters<typeof runtime.setState>[0] = {
      ...runtime.getState(),
      // @ts-expect-error messages must remain UiMessage[]
      messages: ["draft"],
    }

    void invalidState

    expect(runtime.getState().status).toBe("streaming")
  })

  it("surfaces error status after a failed message event", () => {
    const runtime = createChatRuntime({ conversationId: "demo" })

    runtime.dispatch({
      type: "message.started",
      messageId: "m1",
      role: "assistant",
    })
    runtime.dispatch({
      type: "message.failed",
      messageId: "m1",
      error: "boom",
    })

    expect(runtime.getState()).toMatchObject({
      status: "error",
      error: "boom",
    })
  })
})
