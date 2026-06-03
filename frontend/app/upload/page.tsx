'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isLoggedIn } from '@/lib/auth'

export default function UploadPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login')
    } else {
      setAuthChecked(true)
    }
  }, [router])

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
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
      setFile(f)
      setError('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setProgress(Math.round((ev.loaded / ev.total) * 100))
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
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.send(formData)
  }

  if (!authChecked) {
    return (
      <div className="library-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading…</p>
      </div>
    )
  }

  return (
    <div className="upload-page">
      <header className="upload-header">
        <span className="upload-brand">betterReading</span>
        <Link href="/dashboard" className="btn-icon">← Back</Link>
      </header>

      <div className="upload-body">
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="upload-form-header">
            <h1 className="upload-form-title">Upload a book</h1>
            <p className="upload-form-sub">PDF or EPUB · Max 50 MB</p>
          </div>

          <div
            className="upload-zone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf,.epub"
              onChange={handleFilePick}
              style={{ display: 'none' }}
              id="file-input"
            />
            <label htmlFor="file-input" className="upload-zone-label">
              <span className="upload-zone-icon">📄</span>
              {file ? (
                <p className="upload-zone-filename">{file.name}</p>
              ) : (
                <>
                  <p className="upload-zone-primary">Drop file here or click to browse</p>
                  <p className="upload-zone-hint">PDF or EPUB accepted</p>
                </>
              )}
            </label>
          </div>

          <div className="upload-field">
            <label htmlFor="title" className="upload-label">
              Title <span className="upload-label-opt">(optional)</span>
            </label>
            <input
              id="title"
              className="upload-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Auto-detected from file"
            />
          </div>

          <div className="upload-field">
            <label htmlFor="author" className="upload-label">
              Author <span className="upload-label-opt">(optional)</span>
            </label>
            <input
              id="author"
              className="upload-input"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Auto-detected from file"
            />
          </div>

          {loading && (
            <div className="upload-progress">
              <div className="upload-progress-track">
                <div
                  className="upload-progress-fill"
                  style={{ width: `${progress || 5}%` }}
                />
              </div>
              <p className="upload-progress-label">
                {progress > 0 ? `${progress}%` : 'Preparing…'}
              </p>
            </div>
          )}

          {error && <p className="upload-error">{error}</p>}

          <button
            type="submit"
            className="upload-submit"
            disabled={loading || !file}
          >
            {loading ? 'Uploading…' : 'Upload book'}
          </button>
        </form>
      </div>
    </div>
  )
}
