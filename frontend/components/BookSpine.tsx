'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { spineWidth, spineColor, spineMaterial, spineHeightTier } from '@/lib/spines'

const STATUS_LABELS: Record<string, string> = {
  ready: 'Ready',
  processing: 'Processing',
  pending: 'Pending',
}

interface Book {
  id: string
  title: string
  author: string | null
  file_format: string
  file_size: number
  status: string
  created_at: string
}

interface BookSpineProps {
  book: Book
  progressPct: number
  index: number
  isConfirming: boolean
  onRequestDelete: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
}

export default function BookSpine({
  book,
  progressPct,
  index,
  isConfirming,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: BookSpineProps) {
  const isReady = book.status === 'ready'
  const width = spineWidth(book.id)
  const color = spineColor(book.id)
  const material = spineMaterial(book.id)
  const heightTier = spineHeightTier(book.id)

  const spine = (
    <motion.div
      className={`book-spine texture-grain ${material}${color.light ? ' light-cover' : ''}`}
      style={{
        width,
        '--spine-base': color.base,
        '--spine-height-tier': heightTier,
      } as React.CSSProperties}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.045, 0.45), ease: [0.16, 1, 0.3, 1] }}
      whileHover={isReady ? { y: -14, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } } : undefined}
      whileTap={isReady ? { scale: 0.97 } : undefined}
    >
      <span className="spine-head" aria-hidden="true" />

      {!isReady && <div className="spine-status-shimmer skeleton" />}

      {progressPct > 0 && (
        <div
          className="spine-ribbon"
          style={{ height: `${Math.min(Math.max(progressPct, 10), 92)}%` }}
          aria-hidden="true"
        />
      )}

      <button
        className="spine-delete"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRequestDelete() }}
        aria-label={`Delete ${book.title}`}
      >
        ✕
      </button>

      <div className="spine-title">{book.title}</div>

      <div className="spine-footer">
        <span className="spine-format">{book.file_format.toUpperCase()}</span>
        <span className={`spine-status ${book.status}`}>
          <span className={`spine-status-dot ${book.status}`} />
          {STATUS_LABELS[book.status] ?? book.status}
        </span>
        {isReady && <span className="spine-progress-label">{Math.round(progressPct)}% read</span>}
      </div>

      {isConfirming && (
        <div className="spine-confirm-overlay" onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
          <div className="spine-confirm-text">
            <strong>{book.title}</strong>
            Remove from library?
          </div>
          <div className="spine-confirm-actions">
            <button
              className="book-confirm-cancel"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCancelDelete() }}
            >
              Cancel
            </button>
            <button
              className="book-confirm-delete"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onConfirmDelete() }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )

  if (!isReady) {
    return spine
  }

  return (
    <Link href={`/reader/${book.id}`} className="spine-link">
      {spine}
    </Link>
  )
}
