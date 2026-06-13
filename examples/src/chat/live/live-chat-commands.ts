import type { UiComposerCommand } from "../../../../src/composer/lexical"

export const LIVE_CHAT_COMMANDS = [
  {
    id: "slash-analyze",
    kind: "slash",
    label: "Analyze image",
    insertText: "/analyze ",
    description: "Analyze attached images and explain the most important visual details.",
  },
  {
    id: "slash-summarize",
    kind: "slash",
    label: "Summarize",
    insertText: "/summarize ",
    description: "Summarize the current conversation or attached visual context.",
  },
  {
    id: "slash-extract",
    kind: "slash",
    label: "Extract details",
    insertText: "/extract ",
    description: "Extract concrete facts, labels, and notable details from the input.",
  },
  {
    id: "mention-vision",
    kind: "agent",
    label: "@vision",
    insertText: "@vision ",
    description: "Route the request toward image understanding and visual reasoning.",
  },
  {
    id: "mention-writer",
    kind: "agent",
    label: "@writer",
    insertText: "@writer ",
    description: "Route the request toward drafting, rewriting, and polishing text.",
  },
  {
    id: "mention-planner",
    kind: "agent",
    label: "@planner",
    insertText: "@planner ",
    description: "Route the request toward steps, sequencing, and decision planning.",
  },
] satisfies UiComposerCommand[]
