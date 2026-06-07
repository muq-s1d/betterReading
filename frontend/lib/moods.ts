export const MOOD_COLORS: Record<string, string> = {
  'Joy':               'var(--mood-joy)',
  'Excitement':        'var(--mood-excitement)',
  'Sadness':           'var(--mood-sadness)',
  'Fear':              'var(--mood-fear)',
  'Anger':             'var(--mood-anger)',
  'Romance':           'var(--mood-romance)',
  'Tenderness':        'var(--mood-tenderness)',
  'Wonder/Awe':        'var(--mood-wonder)',
  'Tension/Suspense':  'var(--mood-tension)',
  'Mystery':           'var(--mood-mystery)',
  'Grief/Despair':     'var(--mood-grief)',
  'Peace/Calm':        'var(--mood-peace)',
  'Anticipation':      'var(--mood-anticipation)',
  'Disgust':           'var(--mood-disgust)',
  'Neutral':           'var(--mood-neutral)',
}

export function moodColor(emotion: string): string {
  return MOOD_COLORS[emotion] ?? 'var(--mood-neutral)'
}
