'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isLoggedIn } from '@/lib/auth'
import { api } from '@/lib/api'

export default function UploadPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login')
    } else {
      setAuthChecked(true)
    }
  }, [router])
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [fileName, setFileName] = useState('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) {
      setFileName(f.name)
      setError('')
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.currentTarget.classList.add('drag-over')
  }

  function handleDragLeave(e: React.DragEvent) {
    e.currentTarget.classList.remove('drag-over')
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over')
    const f = e.dataTransfer.files?.[0]
    if (f) {
      setFileName(f.name)
      setError('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fileName) {
      setError('Please select a file')
      return
    }

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = fileInput?.files?.[0]
    if (!file) {
      setError('Please select a file')
      return
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !['pdf', 'epub'].includes(ext)) {
      setError(`File must be PDF or EPUB, not .${ext}`)
      return
    }

    if (file.size > 52_428_800) {
      setError('File size must not exceed 50MB')
      return
    }

    setLoading(true)
    setProgress(0)
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)
    formData.append('author', author)

    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status === 201) {
        router.push('/dashboard')
      } else {
        try {
          const err = JSON.parse(xhr.responseText)
          const detail = err.detail || 'Upload failed'
          if (detail.includes('Invalid file type')) {
            setError(`File must be PDF or EPUB, not .${ext}`)
          } else if (detail.includes('too large')) {
            setError('File size must not exceed 50MB')
          } else {
            setError('Upload failed. Please try again.')
          }
        } catch {
          setError('Upload failed. Please try again.')
        }
        setLoading(false)
        setProgress(0)
      }
    }

    xhr.onerror = () => {
      setError('Network error. Please check your connection and try again.')
      setLoading(false)
      setProgress(0)
    }

    xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/books/upload`)
    const token = localStorage.getItem('br_token')
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    }

    xhr.send(formData)
  }

  if (!authChecked) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p style={{ color: "var(--text-secondary)" }}>Loading…</p>
      </main>
    )
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 gap-8">
      <div className="w-full max-w-md">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-lora), serif", margin: 0 }}>
            Upload Book
          </h1>
          <Link href="/dashboard" className="auth-link-btn" style={{ whiteSpace: "nowrap", marginLeft: "12px" }}>
            ← Back
          </Link>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", textAlign: "center" }} className="mb-8">
          PDF or EPUB files only. Max 50MB.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: "2px dashed var(--border-color)",
              borderRadius: "8px",
              padding: "32px 16px",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 200ms",
            }}
            className="drop-zone"
          >
            <input
              type="file"
              accept=".pdf,.epub"
              onChange={handleFilePick}
              style={{ display: "none" }}
              id="file-input"
            />
            <label htmlFor="file-input" style={{ cursor: "pointer", display: "block" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>📄</div>
              <p style={{ fontWeight: 500, marginBottom: "4px" }}>Drag file here or click to browse</p>
              {fileName && <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>{fileName}</p>}
            </label>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 500, marginBottom: "6px" }}>
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leave blank to auto-detect from file"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                fontSize: "0.95rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 500, marginBottom: "6px" }}>
              Author (optional)
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Leave blank to auto-detect from file"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                fontSize: "0.95rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          {loading && (
            <div style={{ opacity: progress > 0 ? 1 : 0.6, transition: "opacity 200ms" }}>
              <div style={{
                width: "100%",
                height: "6px",
                backgroundColor: "var(--bg-secondary)",
                borderRadius: "3px",
                overflow: "hidden",
              }}>
                <div
                  style={{
                    width: `${progress || 5}%`,
                    height: "100%",
                    backgroundColor: "var(--accent)",
                    transition: "width 200ms ease-out",
                  }}
                />
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "6px", textAlign: "center" }}>
                {progress > 0 ? `${progress}%` : "Preparing…"}
              </p>
            </div>
          )}

          {error && (
            <p style={{ color: "#ef4444", fontSize: "0.9rem", padding: "8px 12px", backgroundColor: "rgba(239,68,68,0.1)", borderRadius: "4px" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !fileName}
            style={{
              padding: "10px 16px",
              backgroundColor: loading || !fileName ? "var(--border-color)" : "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.95rem",
              fontWeight: 500,
              cursor: loading || !fileName ? "not-allowed" : "pointer",
              opacity: loading || !fileName ? 0.6 : 1,
            }}
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>
    </main>
  )
}
