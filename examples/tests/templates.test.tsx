import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { $createParagraphNode, $createTextNode, $getRoot, type LexicalEditor } from "lexical"
import { describe, expect, it, vi } from "vitest"
import { AdapterTemplate } from "../templates/adapter-template"
import { AgentShowcaseTemplate } from "../templates/agent-showcase-template"
import { ArtifactTemplate } from "../templates/artifact-template"
import { MinimalAppTemplate } from "../templates/minimal-app"
import { MultimodalTemplate } from "../templates/multimodal-template"
import { UploadTemplate } from "../templates/upload-template"

vi.mock("react-virtuoso", () => ({
  Virtuoso: ({
    data,
    itemContent,
  }: {
    data: unknown[]
    itemContent: (index: number, item?: unknown) => React.ReactNode
  }) => (
    <div>
      {data.map((item, index) => (
        <div key={index}>{itemContent(index, item)}</div>
      ))}
    </div>
  ),
}))

function setEditorText(element: HTMLElement, text: string) {
  const editor = (element as HTMLElement & { __lexicalEditor?: LexicalEditor }).__lexicalEditor

  expect(editor).toBeDefined()

  act(() => {
    editor?.update(() => {
      const root = $getRoot()
      const textNode = $createTextNode(text)
      root.clear()
      root.append($createParagraphNode().append(textNode))
      textNode.select(text.length, text.length)
    })
  })
}

describe("example templates", () => {
  it("renders the docs-backed example templates", () => {
    render(
      <>
        <MinimalAppTemplate />
        <AdapterTemplate />
        <MultimodalTemplate />
        <UploadTemplate />
        <ArtifactTemplate />
        <AgentShowcaseTemplate />
      </>,
    )

    expect(screen.getByRole("heading", { level: 2, name: "Minimal app template" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Adapter integration template" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Multimodal image template" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Upload orchestration template" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Artifact customization template" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Layered agent UI showcase" })).toBeInTheDocument()
  })

  it("renders a submitted image attachment as a user image part", async () => {
    const user = userEvent.setup()
    const file = new File(["image-bytes"], "diagram.png", { type: "image/png" })
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL
    const createObjectURL = vi.fn(() => "blob:diagram")
    const revokeObjectURL = vi.fn()
    let didUnmount = false

    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL })
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL })

    const { unmount } = render(<MultimodalTemplate />)

    const textbox = screen.getByRole("textbox", { name: "Message" })
    fireEvent.paste(textbox, {
      clipboardData: { files: [file], items: [], types: ["Files"] },
    })
    setEditorText(textbox, "What does this diagram show?")

    try {
      await user.click(screen.getByRole("button", { name: /send/i }))

      expect(await screen.findByText("What does this diagram show?")).toBeInTheDocument()
      expect(await screen.findByRole("img", { name: "diagram.png" })).toBeInTheDocument()
      expect(createObjectURL).toHaveBeenCalledWith(file)

      unmount()
      didUnmount = true

      expect(revokeObjectURL).toHaveBeenCalledWith("blob:diagram")
    } finally {
      if (!didUnmount) {
        unmount()
      }

      Object.defineProperty(URL, "createObjectURL", { configurable: true, value: originalCreateObjectURL })
      Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: originalRevokeObjectURL })
    }
  })

  it("shows adapter diagnostics alongside normalized output", () => {
    render(<AdapterTemplate />)

    expect(screen.getByText(/Adapter-mapped host events/i)).toBeInTheDocument()
    expect(screen.getByText(/No adapter diagnostics for this transcript\./i)).toBeInTheDocument()
  })

  it("keeps upload orchestration on the public composer contract with file-backed attachments", () => {
    render(<UploadTemplate />)

    expect(screen.getByText(/Controlled attachments keep upload progression in host-owned state\./i)).toBeInTheDocument()
    expect(screen.getByText("release-notes.pdf")).toBeInTheDocument()
    expect(screen.getByText("65% uploaded")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Send" })).toHaveAttribute(
      "data-send-blocked-reason",
      "attachments-uploading",
    )
  })

  it("composes command intent, image input, and agent steps in the showcase", () => {
    render(<AgentShowcaseTemplate />)

    expect(screen.getByText(/Commands, image input, and agent steps composed through public contracts\./i)).toBeInTheDocument()
    expect(screen.getByText("@researcher")).toBeInTheDocument()
    expect(screen.getByText("mcp:browser.search")).toBeInTheDocument()
    expect(screen.getByText("Submitted command payload")).toBeInTheDocument()
    expect(screen.getByText(/"id": "agent-research"/)).toBeInTheDocument()
    expect(screen.getByText(/"kind": "agent"/)).toBeInTheDocument()
    expect(screen.getByText(/"server": "browser"/)).toBeInTheDocument()
    expect(screen.getByText("Selected command metadata: agent=researcher, mcp=browser.search")).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Uploaded product sketch" })).toBeInTheDocument()
    expect(screen.getByText("Plan response")).toBeInTheDocument()
    expect(screen.getByText("Search docs")).toBeInTheDocument()
    expect(screen.getByText("Inspect image")).toBeInTheDocument()
    expect(screen.getByText("Apply product writing skill")).toBeInTheDocument()
    expect(screen.getByText(/Showcase complete: command intent stayed in the composer payload/i)).toBeInTheDocument()
  })

  it("forwards the real artifact renderer input into the default body helper", () => {
    render(<ArtifactTemplate />)

    expect(screen.getByText(/Artifact registry overrides customize rendering/i)).toBeInTheDocument()
    expect(screen.getByText("const customized = true")).toBeInTheDocument()
    expect(screen.getByText(/part id: artifact-part/i)).toBeInTheDocument()
  })
})
