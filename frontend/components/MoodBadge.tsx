'use client'

import { memo, useEffect, useRef, useState } from 'react'
import { moodColor } from '@/lib/moods'

interface Props {
  emotion: string
}

const MoodBadge = memo(function MoodBadge({ emotion }: Props) {
  const [visible, setVisible] = useState(false)
  const [displayed, setDisplayed] = useState(emotion)
  const prevEmotion = useRef(emotion)

  useEffect(() => {
    setVisible(true)
  }, [])

  useEffect(() => {
    if (emotion === prevEmotion.current) return
    prevEmotion.current = emotion
    setVisible(false)
    const t = setTimeout(() => {
      setDisplayed(emotion)
      setVisible(true)
    }, 200)
    return () => clearTimeout(t)
  }, [emotion])

  const color = moodColor(displayed)

  return (
    <div
      className="mood-badge"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.2s ease' }}
    >
      <span
        className="mood-badge-dot"
        style={{ backgroundColor: color }}
      />
      <span className="mood-badge-label">{displayed}</span>
    </div>
  )
})

export default MoodBadge
