'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { isLoggedIn, clearToken } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    setLoggedIn(isLoggedIn())
  }, [])

  function handleLogout() {
    clearToken()
    setLoggedIn(false)
    router.refresh()
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 gap-6">
      <h1
        className="text-4xl tracking-tight"
        style={{ fontFamily: "var(--font-lora), serif" }}
      >
        betterReading
      </h1>
      {loggedIn ? (
        <div className="flex flex-col items-center gap-3">
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            You&apos;re signed in.
          </p>
          <button onClick={handleLogout} className="auth-link-btn">
            Sign out
          </button>
        </div>
      ) : (
        <div className="flex gap-4">
          <Link href="/login" className="auth-link-btn">Sign in</Link>
          <Link href="/register" className="auth-link-btn">Register</Link>
        </div>
      )}
    </main>
  )
}
