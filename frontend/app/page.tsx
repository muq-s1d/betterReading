'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { isLoggedIn } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    if (isLoggedIn()) {
      router.push('/dashboard')
    }
  }, [router])

  return (
    <main className="landing">
      <div className="landing-glow" />

      <div className="landing-inner">
        <p className="landing-eyebrow">AI-Powered E-Reader</p>

        <h1 className="landing-title">
          better<em>Reading</em>
        </h1>

        <div className="landing-rule" />

        <p className="landing-tagline">
          Upload any book.<br />
          We read the mood.<br />
          The music follows.
        </p>

        <div className="landing-cta">
          <Link href="/login" className="btn-primary">Sign in</Link>
          <Link href="/register" className="btn-ghost">Get started</Link>
        </div>
      </div>

      <div className="landing-footer">
        <span className="landing-feat">PDF &amp; EPUB</span>
        <span className="landing-sep">·</span>
        <span className="landing-feat">NLP Analysis</span>
        <span className="landing-sep">·</span>
        <span className="landing-feat">Mood Music</span>
      </div>
    </main>
  )
}
