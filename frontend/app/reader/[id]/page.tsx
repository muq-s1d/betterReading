'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { isLoggedIn } from '@/lib/auth'
import { api } from '@/lib/api'
import { moodColor } from '@/lib/moods'
import MoodBadge from '@/components/MoodBadge'
import ReaderChunk from '@/components/ReaderChunk'
import ReaderSettingsPanel from '@/components/ReaderSettings'
import { loadSettings, saveSettings, fontCssVar, ReaderSettings } from '@/lib/reader-settings'

interface MoodChunk {
  chunk_index: number
  emotion: string
  confidence: number
  text: string | null
  smoothed_emotion?: string | null
}

interface MoodTimeline {
  book_id: string
  total_chunks: number
  timeline: MoodChunk[]
}

interface ProgressOut {
  book_id: string
  scroll_percent: number
}

interface BookInfo {
  title: string
  author: string | null
}

export default function ReaderPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.id as string

  const [timeline, setTimeline] = useState<MoodChunk[]>([])
  const [bookInfo, setBookInfo] = useState<BookInfo | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savedScrollPct, setSavedScrollPct] = useState(0)
  const [docScrollPct, setDocScrollPct] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<ReaderSettings>(() => loadSettings())
  const [headerShown, setHeaderShown] = useState(true)

  const didRestore = useRef(false)
  const docScrollPctRef = useRef(0)
  const lastScrollY = useRef(0)

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login')
      return
    }
    load()
  }, [bookId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    try {
      const [moodData, progressData, books] = await Promise.all([
        api.get<MoodTimeline>(`/mood/${bookId}`),
        api.get<ProgressOut>(`/progress/${bookId}`),
        api.get<Array<BookInfo & { id: string }>>('/books'),
      ])

      setTimeline(moodData.timeline)
      setSavedScrollPct(progressData.scroll_percent)

      const book = books.find((b) => b.id === bookId)
      if (book) setBookInfo({ title: book.title, author: book.author })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load book')
    } finally {
      setLoading(false)
    }
  }

  // Restore scroll position after content renders
  useEffect(() => {
    if (!loading && timeline.length > 0 && !didRestore.current) {
      didRestore.current = true
      if (savedScrollPct > 0) {
        requestAnimationFrame(() => {
          const max = document.documentElement.scrollHeight - window.innerHeight
          if (max > 0) window.scrollTo({ top: (savedScrollPct / 100) * max, behavior: 'instant' })
        })
      }
    }
  }, [loading, timeline, savedScrollPct])

  // Track document scroll % for progress bar (local only — no DB write here)
  useEffect(() => {
    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0
      docScrollPctRef.current = pct
      setDocScrollPct(pct)

      // Smart header
      if (window.scrollY < 80) {
        setHeaderShown(true)
      } else if (window.scrollY > lastScrollY.current + 8) {
        setHeaderShown(false)
      } else if (window.scrollY < lastScrollY.current - 8) {
        setHeaderShown(true)
      }
      lastScrollY.current = window.scrollY
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [bookId])

  // Save progress when the user leaves: switches tabs, closes the tab/browser,
  // or navigates away within the app. `keepalive` lets the request complete
  // even after the page starts unloading.
  useEffect(() => {
    function saveProgress() {
      if (docScrollPctRef.current > 0) {
        api.post(`/progress/${bookId}`, { scroll_percent: docScrollPctRef.current }, { keepalive: true }).catch(() => null)
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') saveProgress()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', saveProgress)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', saveProgress)
      saveProgress()
    }
  }, [bookId])

  const handleVisible = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  function handleSettingsChange(s: ReaderSettings) {
    setSettings(s)
    saveSettings(s)
  }

  const currentChunk = timeline[currentIndex]
  const currentEmotion = currentChunk?.smoothed_emotion ?? currentChunk?.emotion ?? 'Neutral'
  const hasText = timeline.some((c) => c.text)

  const readerStyle: React.CSSProperties = {
    fontFamily: fontCssVar(settings.fontFamily),
    fontSize: `${settings.fontSize}px`,
    color: settings.text,
    background: settings.bg,
    maxWidth: `${settings.contentWidth}px`,
  }

  if (loading) {
    return (
      <div className="reader-page">
        <div className="reader-loading">
          <p className="reader-loading-text">Opening book…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="reader-page">
        <div className="reader-empty">
          <p className="reader-empty-title">Could not open this book</p>
          <p className="reader-empty-sub">{error}</p>
          <Link href="/dashboard" className="btn-ghost" style={{ marginTop: '0.75rem' }}>
            ← Back to Library
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="reader-page" style={{ background: settings.bg }}>
      <div
        className="reader-progress-bar"
        style={{
          width: `${docScrollPct}%`,
          background: moodColor(currentEmotion),
        }}
      />

      <header
        className="reader-header"
        style={{ transform: headerShown ? 'translateY(0)' : 'translateY(-100%)' }}
      >
        <Link href="/dashboard" className="reader-back">
          ← Library
        </Link>
        {bookInfo && (
          <div className="reader-header-meta">
            <span className="reader-title">{bookInfo.title}</span>
            {bookInfo.author && (
              <span className="reader-author">{bookInfo.author}</span>
            )}
          </div>
        )}
        <button
          className="reader-settings-btn"
          onClick={() => setSettingsOpen((o) => !o)}
          aria-label="Reader settings"
          title="Reader settings"
        >
          ⚙
        </button>
      </header>

      {!hasText ? (
        <div className="reader-empty">
          <p className="reader-empty-title">Text not available</p>
          <p className="reader-empty-sub">
            This book was processed before text storage was added. Please re-upload
            it to enable the reading experience.
          </p>
          <Link href="/upload" className="btn-primary" style={{ marginTop: '0.75rem' }}>
            Re-upload book
          </Link>
        </div>
      ) : (
        <main className="reader-body" style={readerStyle}>
          {timeline.map((chunk) =>
            chunk.text ? (
              <div key={chunk.chunk_index} id={`chunk-${chunk.chunk_index}`}>
                <ReaderChunk
                  chunkIndex={chunk.chunk_index}
                  text={chunk.text}
                  onVisible={handleVisible}
                />
              </div>
            ) : null
          )}
        </main>
      )}

      {hasText && <MoodBadge emotion={currentEmotion} />}

      {settingsOpen && (
        <ReaderSettingsPanel
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
