export type FontFamily = 'lora' | 'garamond' | 'merriweather' | 'sans' | 'mono'

export interface ReaderSettings {
  bg: string
  text: string
  fontSize: number
  fontFamily: FontFamily
  contentWidth: number
}

export const PRESETS = [
  { name: 'Default',  bg: '#0d0d12', text: '#e8e6e1' },
  { name: 'Sepia',    bg: '#f4ecd8', text: '#3b2a1a' },
  { name: 'Paper',    bg: '#f9f7f4', text: '#1a1a1a' },
  { name: 'Midnight', bg: '#0a0e1a', text: '#c9d4e8' },
  { name: 'Warm',     bg: '#1a1208', text: '#f0dfc0' },
] as const

export const FONT_OPTIONS: { key: FontFamily; label: string; cssVar: string }[] = [
  { key: 'lora',        label: 'Lora',         cssVar: 'var(--font-lora), serif' },
  { key: 'garamond',    label: 'Garamond',      cssVar: 'var(--font-garamond), serif' },
  { key: 'merriweather',label: 'Merriweather',  cssVar: 'var(--font-merriweather), serif' },
  { key: 'sans',        label: 'DM Sans',       cssVar: 'var(--font-dm-sans), sans-serif' },
  { key: 'mono',        label: 'Mono',          cssVar: 'var(--font-mono), monospace' },
]

export const DEFAULT_SETTINGS: ReaderSettings = {
  bg: '#0d0d12',
  text: '#e8e6e1',
  fontSize: 18,
  fontFamily: 'lora',
  contentWidth: 680,
}

const STORAGE_KEY = 'br_reader_settings'

export function loadSettings(): ReaderSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(s: ReaderSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

export function fontCssVar(family: FontFamily): string {
  return FONT_OPTIONS.find((f) => f.key === family)?.cssVar ?? FONT_OPTIONS[0].cssVar
}
