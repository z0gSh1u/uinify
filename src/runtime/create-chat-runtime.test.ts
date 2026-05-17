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
      messages: ["draft"],
    })

    expect(runtime.getState().messages).toEqual(["draft"])
  })
})
