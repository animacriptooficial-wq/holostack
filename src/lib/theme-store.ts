import {
  supabaseConfig,
  supabaseReadFileAuthed,
  supabaseUploadFile,
} from "./supabase"

const THEME_OBJECT = "__settings__/site_theme.txt"

const VALID_THEMES = new Set([
  "carbon",
  "cyber",
  "obsidian",
  "royal",
  "crimson",
  "arctic",
  "solar",
  "matrix",
  "sunset",
  "titanium",
])

export function isValidThemeId(value: unknown): value is string {
  return typeof value === "string" && VALID_THEMES.has(value)
}

export async function getSiteTheme(): Promise<string | null> {
  const cfg = supabaseConfig()
  if (!cfg) return null
  const theme = (await supabaseReadFileAuthed(cfg, THEME_OBJECT))?.trim() ?? ""
  return VALID_THEMES.has(theme) ? theme : null
}

export async function setSiteTheme(theme: string): Promise<boolean> {
  const cfg = supabaseConfig()
  if (!cfg || !VALID_THEMES.has(theme)) return false
  const url = await supabaseUploadFile(cfg, THEME_OBJECT, theme)
  return url !== null
}
