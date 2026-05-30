import type { UiComposerCommand } from "../../contracts"
import { CommandPlugin } from "./command-plugin"

export type MentionPluginProps = {
  query: string
  commands: UiComposerCommand[]
  onSelect: (command: UiComposerCommand) => void
}

export function MentionPlugin({ query, commands, onSelect }: MentionPluginProps) {
  if (!query.startsWith("@")) {
    return null
  }

  return <CommandPlugin commands={commands} onSelect={onSelect} query={query} />
}
