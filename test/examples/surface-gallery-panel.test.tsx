import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { CSSProperties, ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { SurfaceGalleryPanel } from "../../examples/src/chat/gallery/SurfaceGalleryPanel"
import type { UiMessage } from "../../src/model/types"

vi.mock("react-virtuoso", () => ({
  Virtuoso: ({
    computeItemKey,
    data,
    itemContent,
    style,
    totalCount,
  }: {
    computeItemKey?: (index: number, message: UiMessage) => string
    data: UiMessage[]
    itemContent: (index: number, message?: UiMessage) => ReactNode
    style?: CSSProperties
    totalCount: number
  }) => (
    <div data-testid="virtuoso-mock" data-count={totalCount} style={style}>
      {data.map((message, index) => (
        <div key={computeItemKey?.(index, message) ?? index}>{itemContent(index, message)}</div>
      ))}
    </div>
  ),
}))

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("SurfaceGalleryPanel", () => {
  it("renders a deterministic transcript without calling the chat API", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(() => {
      throw new Error("Surface gallery must not call fetch.")
    })

    vi.stubGlobal("fetch", fetchMock)
    render(<SurfaceGalleryPanel />)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByRole("heading", { name: /ui surface gallery/i })).toBeInTheDocument()
    expect(screen.getByTestId("virtuoso-mock")).toHaveAttribute("data-count", "2")

    expect(screen.getByText(/please review these uploaded images/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "uploaded-reference.png" })).toBeInTheDocument()
    expect(screen.getByText("uploading-wireframe.jpg")).toBeInTheDocument()
    expect(screen.getByText("67% uploaded")).toBeInTheDocument()
    expect(screen.getByText("rejected-large-image.gif")).toBeInTheDocument()
    expect(screen.getByText(/animated GIFs are not supported/i)).toBeInTheDocument()

    expect(screen.getByText(/this deterministic answer exercises the chat surface/i)).toBeInTheDocument()
    expect(screen.getByText("Tool: image metadata lookup")).toBeInTheDocument()
    expect(screen.getByText("Planner: compose response outline")).toBeInTheDocument()
    expect(screen.getByText("Workflow: publish gallery artifact")).toBeInTheDocument()

    const runningStep = screen.getByText("Tool: image metadata lookup").closest('[data-slot="step"]')
    const completeStep = screen
      .getByText("Planner: compose response outline")
      .closest('[data-slot="step"]')
    const errorStep = screen.getByText("Workflow: publish gallery artifact").closest('[data-slot="step"]')

    expect(runningStep).toHaveAttribute("data-state", "running")
    expect(runningStep).toHaveClass("surface-gallery-step")
    expect(within(runningStep as HTMLElement).getByText("running")).toBeInTheDocument()
    expect(completeStep).toHaveAttribute("data-state", "complete")
    expect(within(completeStep as HTMLElement).getByText("complete")).toBeInTheDocument()
    expect(
      within(completeStep as HTMLElement).getByText(
        "Reasoning, steps, image, artifact, attachment, and action surfaces included.",
      ),
    ).toBeInTheDocument()
    expect(errorStep).toHaveAttribute("data-state", "error")
    expect(within(errorStep as HTMLElement).getByText("error")).toBeInTheDocument()
    expect(
      within(errorStep as HTMLElement).getByText("Publishing is disabled for deterministic fixtures."),
    ).toBeInTheDocument()

    expect(screen.getByRole("status")).toHaveTextContent("Latest action: none")
    expect(screen.queryByText(/reasoning trace/i)).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Show reasoning" }))
    expect(screen.getByText(/reasoning trace/i)).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent(
      "Latest action: toggle-reasoning reasoning part on assistant-gallery-message",
    )

    expect(screen.getByRole("img", { name: "Inline preview of a gallery card" })).toHaveAttribute(
      "data-gallery-image",
      "showcase",
    )

    const artifact = screen
      .getByText("Surface gallery bundle", { selector: '[data-slot="artifact-title"]' })
      .closest('[data-slot="artifact-container"]')

    expect(artifact).toBeTruthy()
    expect(within(artifact as HTMLElement).getByRole("button", { name: "Summary" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    expect(within(artifact as HTMLElement).getByRole("button", { name: "JSON" })).toBeInTheDocument()
    expect(within(artifact as HTMLElement).getByRole("button", { name: "Source" })).toBeInTheDocument()
    expect(within(artifact as HTMLElement).getByText(/Preview surface tabs/i)).toBeInTheDocument()

    await user.click(within(artifact as HTMLElement).getByRole("button", { name: "JSON" }))

    expect(screen.getByRole("status")).toHaveTextContent(
      "Latest action: opened JSON view for Surface gallery bundle",
    )
    expect(within(artifact as HTMLElement).getByText(/"deterministic": true/)).toBeInTheDocument()
    expect(within(artifact as HTMLElement).getByText(/"text"/)).toBeInTheDocument()

    await user.click(within(artifact as HTMLElement).getByRole("button", { name: "Source" }))

    expect(screen.getByRole("status")).toHaveTextContent(
      "Latest action: opened Source view for Surface gallery bundle",
    )
    expect(within(artifact as HTMLElement).getByText(/export const galleryFixture/i)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Retry message" }))

    expect(screen.getByRole("status")).toHaveTextContent(
      "Latest action: retry message on assistant-gallery-message",
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
