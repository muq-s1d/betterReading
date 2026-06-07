'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isLoggedIn, clearToken } from '@/lib/auth'
import { api } from '@/lib/api'

interface Book {
  id: string
  title: string
  author: string | null
  file_format: string
  file_size: number
  status: string
  created_at: string
}

export default function Dashboard() {
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchBooks = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const data = await api.get<Book[]>('/books')
      setBooks(data)
      if (data.length > 0) {
        const readyBooks = data.filter((b) => b.status === 'ready')
        const progressResults = await Promise.all(
          readyBooks.map((b) =>
            api.get<{ book_id: string; scroll_percent: number }>(`/progress/${b.id}`)
              .then((p) => ({ id: b.id, pct: p.scroll_percent }))
              .catch((err) => {
                console.error(`Progress fetch failed for ${b.id}:`, err)
                return { id: b.id, pct: 0 }
              })
          )
        )
        const map: Record<string, number> = {}
        for (const r of progressResults) map[r.id] = r.pct
        setProgress(map)
      }
    } catch (err) {
      setError('Failed to load books')
      console.error(err)
    } finally {
      if (!silent) setRefreshing(false)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const hasProcessing = books.some((b) => b.status === 'pending' || b.status === 'processing')
    if (hasProcessing) {
      pollTimer.current = setTimeout(() => fetchBooks(true), 10_000)
    }
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current)
    }
  }, [books, fetchBooks])

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login')
      return
    }
    fetchBooks()
  }, [router, fetchBooks])

  async function handleDeleteConfirm(bookId: string) {
    setConfirmDeleteId(null)
    try {
      await api.delete(`/books/${bookId}`)
      setBooks((prev) => prev.filter((b) => b.id !== bookId))
      setProgress((prev) => {
        const next = { ...prev }
        delete next[bookId]
        return next
      })
    } catch (err) {
      setError('Failed to delete book')
      console.error(err)
    }
  }

  function handleLogout() {
    clearToken()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="library-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading…</p>
      </div>
    )
  }

  return (
    <div className="library-page">
      <header className="library-header">
        <span className="library-brand">betterReading</span>
        <nav className="library-nav">
          <button
            onClick={() => fetchBooks()}
            className="btn-icon"
            disabled={refreshing}
            aria-label="Refresh library"
            title="Refresh"
          >
            {refreshing ? '…' : '↺'}
          </button>
          <Link href="/upload" className="btn-icon">+ Upload</Link>
          <button onClick={handleLogout} className="btn-icon">Sign out</button>
        </nav>
      </header>

      <div className="library-body">
        <div className="library-heading">
          <h1>My Library</h1>
          {books.length > 0 && (
            <span className="library-count">
              {books.length} {books.length === 1 ? 'book' : 'books'}
            </span>
          )}
        </div>

        {error && (
          <p className="upload-error" style={{ marginBottom: '1.5rem' }}>{error}</p>
        )}

        <div className="library-grid">
          {books.length === 0 ? (
            <div className="library-empty">
              <p className="library-empty-title">Your shelf is empty</p>
              <p className="library-empty-sub">Upload a book to get started</p>
              <Link href="/upload" className="btn-primary">Upload your first book</Link>
            </div>
          ) : (
            books.map((book) => {
              const isReady = book.status === 'ready'
              const pct = progress[book.id] ?? 0
              const isConfirming = confirmDeleteId === book.id

              const card = (
                <div key={book.id} className="book-card" style={{ cursor: isReady ? 'pointer' : 'default' }}>
                  {isConfirming && (
                    <div className="book-confirm-overlay" onClick={(e) => e.preventDefault()}>
                      <div className="book-confirm-text">
                        <strong>{book.title}</strong>
                        Remove from library?
                      </div>
                      <div className="book-confirm-actions">
                        <button
                          className="book-confirm-cancel"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDeleteId(null) }}
                        >
                          Cancel
                        </button>
                        <button
                          className="book-confirm-delete"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteConfirm(book.id) }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                  <button
                    className="book-delete"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDeleteId(book.id) }}
                    aria-label={`Delete ${book.title}`}
                  >
                    ✕
                  </button>
                  <div className="book-glyph">{book.title.charAt(0).toUpperCase()}</div>
                  <p className="book-title">{book.title}</p>
                  {book.author && <p className="book-author">{book.author}</p>}
                  <div className="book-meta">
                    <span className="book-format">{book.file_format.toUpperCase()}</span>
                    <span className={`book-status ${book.status}`}>
                      <span className="book-status-dot" />
                      {book.status}
                    </span>
                    <span className="book-size">{(book.file_size / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                  {isReady && pct > 0 && (
                    <span className="book-progress-pct">{Math.round(pct)}% read</span>
                  )}
                </div>
              )

              return isReady ? (
                <Link key={book.id} href={`/reader/${book.id}`} style={{ textDecoration: 'none', display: 'contents' }}>
                  {card}
                </Link>
              ) : (
                <div key={book.id} style={{ display: 'contents' }}>{card}</div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
