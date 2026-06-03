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
      <main className="flex items-center justify-center min-h-screen">
        <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-6 py-8" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-lora), serif" }}>
            My Books
          </h1>
          <div className="flex gap-3">
            <Link href="/upload" className="auth-link-btn">
              + Upload
            </Link>
            <button onClick={handleLogout} className="auth-link-btn" style={{ backgroundColor: "transparent", color: "var(--accent)", border: "1px solid var(--accent)" }}>
              Sign out
            </button>
          </div>
        </div>

        {error && (
          <p style={{ color: "#ef4444", padding: "12px", backgroundColor: "rgba(239,68,68,0.1)", borderRadius: "6px", marginBottom: "16px" }}>
            {error}
          </p>
        )}

        {books.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "48px 24px",
            backgroundColor: "var(--bg-secondary)",
            borderRadius: "8px",
          }}>
            <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
              No books yet
            </p>
            <Link href="/upload" className="auth-link-btn">
              Upload your first book
            </Link>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "16px",
          }}>
            {books.map((book) => (
              <div
                key={book.id}
                style={{
                  padding: "16px",
                  backgroundColor: "var(--bg-secondary)",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                }}
              >
                <h2 style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  marginBottom: "8px",
                  lineHeight: "1.3",
                }}>
                  {book.title}
                </h2>
                {book.author && (
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
                    by {book.author}
                  </p>
                )}
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: "0.75rem",
                    padding: "4px 8px",
                    backgroundColor: "var(--accent)",
                    color: "white",
                    borderRadius: "4px",
                    fontWeight: 500,
                  }}>
                    {book.file_format.toUpperCase()}
                  </span>
                  <span style={{
                    fontSize: "0.75rem",
                    padding: "4px 8px",
                    backgroundColor: book.status === "ready" ? "#10b981" : "#f59e0b",
                    color: "white",
                    borderRadius: "4px",
                    fontWeight: 500,
                  }}>
                    {book.status}
                  </span>
                </div>
                <p style={{
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                }}>
                  {(book.file_size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
