export interface ShortcutConfig {
  commandPalette: string
  [key: string]: string
}

export const defaultShortcuts: ShortcutConfig = {
  commandPalette: "mod+k",
  newProject: "mod+shift+p",
  newTask: "mod+shift+t",
  newSecret: "mod+shift+s",
  newNote: "mod+shift+n",
  toggleTheme: "mod+shift+t",
}

export function parseShortcut(shortcut: string): {
  key: string
  ctrl: boolean
  shift: boolean
  alt: boolean
  meta: boolean
} {
  const parts = shortcut.toLowerCase().split("+")
  return {
    key: parts[parts.length - 1],
    ctrl: parts.includes("ctrl"),
    shift: parts.includes("shift"),
    alt: parts.includes("alt"),
    meta: parts.includes("mod") || parts.includes("meta"),
  }
}

export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: string
): boolean {
  const parsed = parseShortcut(shortcut)
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0
  const modKey = isMac ? event.metaKey : event.ctrlKey

  return (
    event.key.toLowerCase() === parsed.key &&
    modKey === parsed.meta &&
    event.shiftKey === parsed.shift &&
    event.altKey === parsed.alt
  )
}

export function formatShortcut(shortcut: string): string {
  const parts = shortcut.split("+")
  const isMac = typeof window !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0

  return parts
    .map((part) => {
      if (part === "mod") {
        return isMac ? "⌘" : "Ctrl"
      }
      if (part === "ctrl") return "Ctrl"
      if (part === "shift") return "Shift"
      if (part === "alt") return "Alt"
      return part.toUpperCase()
    })
    .join(isMac ? "" : "+")
}

