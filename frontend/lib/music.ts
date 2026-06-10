export interface MusicSettings {
  enabled: boolean
  volume: number
  muted: boolean
}

export const DEFAULT_MUSIC_SETTINGS: MusicSettings = {
  enabled: true,
  volume: 0.5,
  muted: false,
}

const STORAGE_KEY = 'br_music_settings'

export function loadMusicSettings(): MusicSettings {
  if (typeof window === 'undefined') return DEFAULT_MUSIC_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_MUSIC_SETTINGS
    return { ...DEFAULT_MUSIC_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_MUSIC_SETTINGS
  }
}

export function saveMusicSettings(s: MusicSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

export const MOOD_TRACKS: Record<string, string[]> = {
  'Joy': ['/music/joy/track-1.mp3', '/music/joy/track-2.mp3', '/music/joy/track-3.mp3'],
  'Excitement': ['/music/excitement/track-1.mp3', '/music/excitement/track-2.mp3', '/music/excitement/track-3.mp3'],
  'Sadness': ['/music/sadness/track-1.mp3', '/music/sadness/track-2.mp3', '/music/sadness/track-3.mp3'],
  'Fear': ['/music/fear/track-1.mp3', '/music/fear/track-2.mp3', '/music/fear/track-3.mp3'],
  'Anger': ['/music/anger/track-1.mp3', '/music/anger/track-2.mp3', '/music/anger/track-3.mp3'],
  'Romance': ['/music/romance/track-1.mp3', '/music/romance/track-2.mp3', '/music/romance/track-3.mp3'],
  'Tenderness': ['/music/tenderness/track-1.mp3', '/music/tenderness/track-2.mp3', '/music/tenderness/track-3.mp3'],
  'Wonder/Awe': ['/music/wonder-awe/track-1.mp3', '/music/wonder-awe/track-2.mp3', '/music/wonder-awe/track-3.mp3'],
  'Tension/Suspense': ['/music/tension-suspense/track-1.mp3', '/music/tension-suspense/track-2.mp3', '/music/tension-suspense/track-3.mp3'],
  'Mystery': ['/music/mystery/track-1.mp3', '/music/mystery/track-2.mp3', '/music/mystery/track-3.mp3'],
  'Grief/Despair': ['/music/grief-despair/track-1.mp3', '/music/grief-despair/track-2.mp3', '/music/grief-despair/track-3.mp3'],
  'Peace/Calm': ['/music/peace-calm/track-1.mp3', '/music/peace-calm/track-2.mp3', '/music/peace-calm/track-3.mp3'],
  'Anticipation': ['/music/anticipation/track-1.mp3', '/music/anticipation/track-2.mp3', '/music/anticipation/track-3.mp3'],
  'Disgust': ['/music/disgust/track-1.mp3', '/music/disgust/track-2.mp3', '/music/disgust/track-3.mp3'],
  'Neutral': ['/music/neutral/track-1.mp3', '/music/neutral/track-2.mp3', '/music/neutral/track-3.mp3'],
}

export function pickTrack(emotion: string, exclude?: string): string {
  const tracks = MOOD_TRACKS[emotion] || MOOD_TRACKS['Neutral']
  if (tracks.length === 1) return tracks[0]

  let candidate = tracks[Math.floor(Math.random() * tracks.length)]
  let attempts = 0
  while (candidate === exclude && attempts < 10) {
    candidate = tracks[Math.floor(Math.random() * tracks.length)]
    attempts++
  }
  return candidate
}
