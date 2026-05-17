import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { LexicalComposer } from "./lexical-composer"

vi.mock("@lexical/react/LexicalComposer", () => ({
  LexicalComposer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@lexical/react/LexicalHistoryPlugin", () => ({
  HistoryPlugin: () => null,
}))

vi.mock("@lexical/react/LexicalOnChangePlugin", () => ({
  OnChangePlugin: () => null,
}))

vi.mock("@lexical/react/LexicalPlainTextPlugin", () => ({
  PlainTextPlugin: ({
    contentEditable,
    placeholder,
  }: {
    contentEditable: React.ReactNode
    placeholder?: React.ReactNode
  }) => (
    <>
      {contentEditable}
      {placeholder}
    </>
  ),
}))

vi.mock("@lexical/react/LexicalContentEditable", () => ({
  ContentEditable: (props: React.ComponentPropsWithoutRef<"div">) => (
    <div contentEditable role="textbox" {...props} />
  ),
}))

describe("LexicalComposer", () => {
  it("submits plain text and initial attachments", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const file = new File(["hello"], "hello.txt", { type: "text/plain" })

    render(
      <LexicalComposer
        initialAttachments={[{ id: "a1", file, status: "ready" }]}
        onSubmit={onSubmit}
      />,
    )

    await user.type(screen.getByRole("textbox"), "Hello world")
    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      text: "Hello world",
      attachments: [{ id: "a1", file, status: "ready" }],
      commands: [],
      mentions: [],
    })
  })
})
