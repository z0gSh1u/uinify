import type { UiComposerCommand } from "../../contracts"
import { CommandPlugin } from "./command-plugin"

export type SlashCommandPluginProps = {
  query: string
  commands: UiComposerCommand[]
  onSelect: (command: UiComposerCommand) => void
}

export function SlashCommandPlugin({ query, commands, onSelect }: SlashCommandPluginProps) {
  if (!query.startsWith("/")) {
    return null
  }

  return <CommandPlugin commands={commands} onSelect={onSelect} query={query} />
}
