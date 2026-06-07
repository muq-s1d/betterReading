'use client'

import { memo, useEffect, useRef } from 'react'

interface Props {
  chunkIndex: number
  text: string
  onVisible: (index: number) => void
}

const ReaderChunk = memo(function ReaderChunk({ chunkIndex, text, onVisible }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onVisible(chunkIndex)
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [chunkIndex, onVisible])

  return (
    <div ref={ref} className="reader-chunk">
      <p>{text}</p>
    </div>
  )
})

export default ReaderChunk
