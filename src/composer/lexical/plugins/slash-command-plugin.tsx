import type { UiComposerChoice } from "../../contracts"

export type SlashCommandPluginProps = {
  query: string
  items: UiComposerChoice[]
  onSelect: (item: UiComposerChoice) => void
}

export function SlashCommandPlugin({ query, items, onSelect }: SlashCommandPluginProps) {
  if (!query.startsWith("/")) {
    return null
  }

  const matches = items.filter((item) => item.label.startsWith(query.slice(1)))

  if (matches.length === 0) {
    return null
  }

  return (
    <div data-slot="slash-menu">
      {matches.map((item) => (
        <button key={item.id} onClick={() => onSelect(item)} type="button">
          {item.label}
        </button>
      ))}
    </div>
  )
}
