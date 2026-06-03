'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function UploadPage() {
  const router = useRouter()
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

    setLoading(true)
    setError('')

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = fileInput?.files?.[0]
    if (!file) {
      setError('File not found')
      setLoading(false)
      return
    }

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
        setError('Upload failed')
        setLoading(false)
      }
    }

    xhr.onerror = () => {
      setError('Upload error')
      setLoading(false)
    }

    xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/books/upload`)
    const token = localStorage.getItem('br_token')
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    }

    xhr.send(formData)
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 gap-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2" style={{ fontFamily: "var(--font-lora), serif" }}>
          Upload Book
        </h1>
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

          {progress > 0 && progress < 100 && (
            <div>
              <div style={{
                width: "100%",
                height: "6px",
                backgroundColor: "var(--bg-secondary)",
                borderRadius: "3px",
                overflow: "hidden",
              }}>
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    backgroundColor: "var(--accent)",
                    transition: "width 200ms",
                  }}
                />
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "6px", textAlign: "center" }}>
                {progress}%
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
