import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { AdapterTemplate } from "./adapter-template"
import { ArtifactTemplate } from "./artifact-template"
import { MinimalAppTemplate } from "./minimal-app"
import { UploadTemplate } from "./upload-template"

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

describe("example templates", () => {
  it("renders the four v0.3 integration templates", () => {
    render(
      <>
        <MinimalAppTemplate />
        <AdapterTemplate />
        <UploadTemplate />
        <ArtifactTemplate />
      </>,
    )

    expect(screen.getByRole("heading", { level: 2, name: "Minimal app template" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Adapter integration template" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Upload orchestration template" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Artifact customization template" })).toBeInTheDocument()
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

  it("forwards the real artifact renderer input into the default body helper", () => {
    render(<ArtifactTemplate />)

    expect(screen.getByText(/Artifact registry overrides customize rendering/i)).toBeInTheDocument()
    expect(screen.getByText("const customized = true")).toBeInTheDocument()
    expect(screen.getByText(/part id: artifact-part/i)).toBeInTheDocument()
  })
})
