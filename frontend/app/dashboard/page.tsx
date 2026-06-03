'use client'

import { useEffect, useState } from 'react'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login')
      return
    }
    fetchBooks()
  }, [router])

  async function fetchBooks() {
    try {
      const data = await api.get<Book[]>('/books')
      setBooks(data)
    } catch (err) {
      setError('Failed to load books')
      console.error(err)
    } finally {
      setLoading(false)
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
            books.map((book) => (
              <div key={book.id} className="book-card">
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
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
