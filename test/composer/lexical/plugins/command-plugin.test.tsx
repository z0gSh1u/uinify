import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { UiComposerCommand } from "../../../../src/composer/contracts"
import { CommandPlugin, filterCommandsForQuery, readCommandTrigger } from "../../../../src/composer/lexical/plugins/command-plugin"

const commands = [
  {
    id: "agent-research",
    kind: "agent",
    label: "Researcher",
    insertText: "@researcher ",
    trigger: "@",
    metadata: { agentId: "researcher" },
  },
  {
    id: "slash-draft",
    kind: "slash",
    label: "draft",
    insertText: "/draft ",
    trigger: "/",
  },
  {
    id: "mcp-browser",
    kind: "mcp",
    label: "browser",
    insertText: "/browser ",
    trigger: "/",
    metadata: { server: "playwright" },
  },
] satisfies UiComposerCommand[]

describe("CommandPlugin", () => {
  it("filters slash and mention commands from one command array", () => {
    expect(filterCommandsForQuery(commands, "/dr").map((command) => command.id)).toEqual(["slash-draft"])
    expect(filterCommandsForQuery(commands, "/bro").map((command) => command.id)).toEqual(["mcp-browser"])
    expect(filterCommandsForQuery(commands, "@res").map((command) => command.id)).toEqual(["agent-research"])
  })

  it("derives the trigger from explicit trigger or insertText", () => {
    expect(readCommandTrigger({ id: "a", kind: "custom", label: "a", insertText: "/a " })).toBe("/")
    expect(readCommandTrigger({ id: "b", kind: "custom", label: "b", insertText: "@b " })).toBe("@")
    expect(readCommandTrigger({ id: "c", kind: "custom", label: "c", insertText: "plain" })).toBe(null)
  })

  it("renders matching command metadata and selects enabled commands", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(<CommandPlugin commands={commands} onSelect={onSelect} query="@res" />)

    expect(screen.getByRole("button", { name: /Researcher/i })).toBeInTheDocument()
    expect(screen.getByText("agent")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Researcher/i }))

    expect(onSelect).toHaveBeenCalledWith(commands[0])
  })

  it("shows disabled commands but does not select them", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <CommandPlugin
        commands={[
          {
            id: "disabled",
            kind: "tool",
            label: "Search",
            insertText: "/search ",
            disabledReason: "Connect MCP first",
          },
        ]}
        onSelect={onSelect}
        query="/sea"
      />,
    )

    const button = screen.getByRole("button", { name: /Search/i })

    expect(button).toBeDisabled()
    expect(screen.getByText("Connect MCP first")).toBeInTheDocument()

    await user.click(button)

    expect(onSelect).not.toHaveBeenCalled()
  })
})
