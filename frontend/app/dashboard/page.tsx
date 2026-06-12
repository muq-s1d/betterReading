'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isLoggedIn, clearToken } from '@/lib/auth'
import { api } from '@/lib/api'
import Shelf from '@/components/Shelf'
import BookSpine from '@/components/BookSpine'
import Skeleton from '@/components/Skeleton'
import PageTransition from '@/components/PageTransition'

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
      router.replace('/login')
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
    router.replace('/login')
  }

  if (loading) {
    return (
      <div className="library-page">
        <header className="library-header">
          <span className="library-brand">betterReading</span>
        </header>
        <div className="library-body">
          <div className="library-heading">
            <h1>My Library</h1>
          </div>
          <Shelf>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="book-spine-skeleton" style={{ width: 48 + (i % 4) * 8 }} />
            ))}
          </Shelf>
        </div>
      </div>
    )
  }

  return (
    <PageTransition>
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

          {books.length === 0 ? (
            <div className="library-empty">
              <p className="library-empty-title">Your shelf is empty</p>
              <p className="library-empty-sub">Upload a book to get started</p>
              <Link href="/upload" className="btn-primary">Upload your first book</Link>
            </div>
          ) : (
            <Shelf>
              {books.map((book, index) => (
                <BookSpine
                  key={book.id}
                  book={book}
                  index={index}
                  progressPct={progress[book.id] ?? 0}
                  isConfirming={confirmDeleteId === book.id}
                  onRequestDelete={() => setConfirmDeleteId(book.id)}
                  onConfirmDelete={() => handleDeleteConfirm(book.id)}
                  onCancelDelete={() => setConfirmDeleteId(null)}
                />
              ))}
            </Shelf>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
