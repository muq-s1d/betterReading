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
    <main className="flex flex-col items-center justify-center min-h-screen px-6 gap-6">
      <h1
        className="text-4xl tracking-tight"
        style={{ fontFamily: "var(--font-lora), serif" }}
      >
        betterReading
      </h1>
      <div className="flex gap-4">
        <Link href="/login" className="auth-link-btn">Sign in</Link>
        <Link href="/register" className="auth-link-btn">Register</Link>
      </div>
    </main>
  )
}
