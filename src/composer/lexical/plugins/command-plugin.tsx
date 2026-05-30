import type { UiComposerCommand, UiComposerCommandTrigger } from "../../contracts"

export type CommandPluginProps = {
  query: string
  commands: UiComposerCommand[]
  onSelect: (command: UiComposerCommand) => void
}

export function CommandPlugin({ query, commands, onSelect }: CommandPluginProps) {
  const matches = filterCommandsForQuery(commands, query)

  if (matches.length === 0) {
    return null
  }

  return (
    <div data-slot="command-menu">
      {matches.map((command) => (
        <button
          aria-describedby={command.disabledReason ? `${command.id}-disabled-reason` : undefined}
          aria-label={command.label}
          disabled={Boolean(command.disabledReason)}
          key={command.id}
          onClick={() => {
            if (!command.disabledReason) {
              onSelect(command)
            }
          }}
          type="button"
        >
          <span>{command.label}</span>
          <span>{command.kind}</span>
          {command.description ? <small>{command.description}</small> : null}
          {command.disabledReason ? <small id={`${command.id}-disabled-reason`}>{command.disabledReason}</small> : null}
        </button>
      ))}
    </div>
  )
}

export function filterCommandsForQuery(commands: UiComposerCommand[], query: string) {
  const trigger = query[0]

  if (trigger !== "/" && trigger !== "@") {
    return []
  }

  const normalizedQuery = query.slice(1).toLowerCase()

  return commands.filter((command) => {
    if (readCommandTrigger(command) !== trigger) {
      return false
    }

    return command.label.toLowerCase().startsWith(normalizedQuery)
  })
}

export function readCommandTrigger(command: UiComposerCommand): UiComposerCommandTrigger | null {
  if (command.trigger === "/" || command.trigger === "@") {
    return command.trigger
  }

  const firstCharacter = command.insertText.trim()[0]

  return firstCharacter === "/" || firstCharacter === "@" ? firstCharacter : null
}
