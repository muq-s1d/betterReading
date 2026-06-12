// Deterministic per-book visual variation for the library shelf. Everything
// here is derived from the book id so a given book always renders as the same
// spine — varying width, height, cover material, and cover color — giving the
// shelf the look of a real, curated library without needing per-book artwork.

export interface SpineColor {
  base: string
  /** light-colored cloth/paper covers get dark embossed titles instead of gold foil */
  light?: boolean
}

// Classic library-binding colors: deep jewel tones + a few aged-paper covers.
const SPINE_COLORS: SpineColor[] = [
  { base: '#722f37' }, // burgundy
  { base: '#8c3b2f' }, // brick red
  { base: '#2f5d50' }, // forest green
  { base: '#2d5560' }, // deep teal
  { base: '#2e4374' }, // navy
  { base: '#5b3a6b' }, // plum
  { base: '#41527a' }, // slate blue
  { base: '#5f6b3a' }, // olive
  { base: '#a85432' }, // terracotta
  { base: '#3a3a44' }, // charcoal cloth
  { base: '#b8863b' }, // ochre
  { base: '#9c5b5b' }, // dusty rose-brown
  { base: '#d8c9a8', light: true }, // aged bone
  { base: '#c9a96a', light: true }, // tan calf
]

export type SpineMaterial = 'leather' | 'cloth' | 'paper'
const MATERIALS: SpineMaterial[] = ['leather', 'cloth', 'paper']

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export function spineWidth(id: string): number {
  const hash = hashString(id)
  return 46 + (hash % 34) // 46-80px
}

export function spineColor(id: string): SpineColor {
  const hash = hashString(id + 'color')
  return SPINE_COLORS[hash % SPINE_COLORS.length]
}

export function spineMaterial(id: string): SpineMaterial {
  const hash = hashString(id + 'material')
  return MATERIALS[hash % MATERIALS.length]
}

// Per-spine height variation so tops aren't perfectly flush (4 tiers, taller spread)
export function spineHeightTier(id: string): number {
  const hash = hashString(id + 'height')
  return hash % 4 // 0, 1, 2, or 3
}
