'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const IG_URL = 'https://www.instagram.com/mentrex_academy/'

type RewardState =
  | { status: 'loading' }
  | { status: 'entered' }
  | { status: 'below' }
  | { status: 'error' }

function Confetti() {
  const colors = ['#ff4400', '#FF8C00', '#f59e0b', '#22c55e', '#3b82f6', '#ec4899']
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
      {Array.from({ length: 22 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-sm"
          style={{
            width: 7 + (i % 4) * 2,
            height: 9 + (i % 3) * 3,
            background: colors[i % colors.length],
            left: `${4 + (i * 4.3) % 92}%`,
            top: '-12px',
          }}
          animate={{ y: [0, 340 + (i % 5) * 60], rotate: [0, 360 + i * 40], opacity: [1, 1, 0] }}
          transition={{ duration: 2 + (i % 4) * 0.35, delay: i * 0.08, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}

function InstagramCard() {
  return (
    <motion.div
      key="entered"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 160 }}
      className="w-full max-w-sm text-center"
    >
      {/* Trophy */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="text-6xl mb-4"
      >
        🏆
      </motion.div>

      <h3 className="text-2xl font-extrabold mb-2">You&apos;re in the running!</h3>
      <p className="text-slate-500 text-sm mb-6 leading-relaxed">
        Great score! You have a chance to win.<br />
        Follow us on Instagram to find out if you won —<br />
        <strong className="text-slate-700">winners announced on April 1st.</strong>
      </p>

      {/* Instagram CTA card */}
      <a
        href={IG_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full rounded-2xl p-5 text-white mb-4"
        style={{ background: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          {/* Instagram icon */}
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 shrink-0">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
          <div className="text-left">
            <p className="font-bold text-base leading-tight">@mentrex_academy</p>
            <p className="text-white/80 text-xs">Follow to see the winner</p>
          </div>
        </div>
        <div className="bg-white/20 rounded-xl py-2.5 font-bold text-sm tracking-wide">
          Follow on Instagram →
        </div>
      </a>

      <p className="text-xs text-slate-400 leading-relaxed">
        🎯 Winner will be announced via our Instagram story on <strong>April 1st</strong>
      </p>

      <Link href="/leaderboard" className="mt-5 inline-flex items-center gap-2 text-primary font-bold hover:underline text-sm">
        View Leaderboard
        <span className="material-symbols-outlined text-sm">arrow_forward</span>
      </Link>
    </motion.div>
  )
}

function ResultContent() {
  const params = useSearchParams()
  const sessionId = params.get('session')
  const score = Number(params.get('score') ?? 0)
  const max = 120
  const accuracy = Math.round((score / max) * 100)

  const [reward, setReward] = useState<RewardState>({ status: 'loading' })

  useEffect(() => {
    if (!sessionId) return
    const stored = sessionStorage.getItem(`reg_${sessionId}`)
    if (!stored) return

    const reg = JSON.parse(stored)
    const controller = new AbortController()

    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: Number(sessionId),
        name: reg.name,
        phone: reg.phone,
        school: reg.school,
        studentClass: reg.studentClass,
        interests: reg.interests ?? [],
      }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        sessionStorage.removeItem(`reg_${sessionId}`)
        try { localStorage.setItem('mentrex_played', '1') } catch {}
        setReward({ status: data.eligible ? 'entered' : 'below' })
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setReward({ status: 'error' })
      })

    return () => controller.abort()
  }, [sessionId])

  const arcDeg = (score / max) * 0.75 * 360

  return (
    <div className="bg-background-light font-display text-slate-900 min-h-screen flex flex-col">
      {reward.status === 'entered' && <Confetti />}

      <header className="flex items-center bg-white p-4 border-b border-primary/10">
        <Link href="/" className="text-primary flex size-10 shrink-0 items-center justify-center cursor-pointer">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h2 className="text-lg font-bold flex-1 text-center pr-10">Result &amp; Reward</h2>
      </header>

      <main className="flex-1 px-6 py-8 flex flex-col items-center">

        {/* Score arc */}
        <div className="relative w-56 h-56 flex items-center justify-center mb-6">
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: 'conic-gradient(from 225deg, #ff4400 0%, #ff4400 270deg, #e5e7eb 270deg)',
              mask: 'radial-gradient(farthest-side, transparent 85%, black 86%)',
              WebkitMask: 'radial-gradient(farthest-side, transparent 85%, black 86%)',
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            style={{
              background: `conic-gradient(from 225deg, #ff4400 0%, #ff4400 ${arcDeg}deg, transparent ${arcDeg}deg)`,
              mask: 'radial-gradient(farthest-side, transparent 85%, black 86%)',
              WebkitMask: 'radial-gradient(farthest-side, transparent 85%, black 86%)',
            }}
          />
          <div className="text-center z-10">
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
              className="block text-6xl font-extrabold text-primary"
            >
              {score}
            </motion.span>
            <span className="block text-sm font-medium text-slate-500 mt-1 uppercase tracking-wider">
              out of {max}
            </span>
          </div>
        </div>

        {/* Accuracy badges */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex gap-3 mb-8"
        >
          <span className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            {accuracy}% Accuracy
          </span>
          {score >= 70 && (
            <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">bolt</span>
              Top Player
            </span>
          )}
        </motion.div>

        {/* Reward section */}
        <AnimatePresence mode="wait">
          {reward.status === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 text-slate-400"
            >
              <svg style={{ animation: 'spin 1s linear infinite', width: 28, height: 28 }} fill="none" viewBox="0 0 24 24">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm font-medium">Checking your result...</p>
            </motion.div>
          )}

          {reward.status === 'entered' && <InstagramCard />}

          {reward.status === 'below' && (
            <motion.div
              key="below"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 160 }}
              className="w-full max-w-sm bg-white rounded-2xl p-8 border border-primary/20 text-center"
            >
              <div className="text-5xl mb-3">💪</div>
              <h3 className="text-2xl font-bold mb-2">
                {score >= 40 ? 'Nice try!' : 'Keep practicing!'}
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                You need <strong>70+</strong> to qualify. You scored {score} — so close!
              </p>
              <Link href="/leaderboard" style={{ background: 'linear-gradient(to right, #FF4500, #FF8C00)' }} className="inline-flex items-center gap-2 text-white font-bold py-3 px-6 rounded-xl">
                View Leaderboard →
              </Link>
            </motion.div>
          )}

          {reward.status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-sm bg-white rounded-2xl p-8 border border-red-100 text-center"
            >
              <div className="text-5xl mb-3">⚠️</div>
              <h3 className="text-xl font-bold mb-2">Something went wrong</h3>
              <p className="text-sm text-slate-500 mb-6">We couldn&apos;t process your result. Please try again.</p>
              <Link href="/" style={{ background: 'linear-gradient(to right, #FF4500, #FF8C00)' }} className="inline-flex items-center gap-2 text-white font-bold py-3 px-6 rounded-xl">
                Back to Home
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  )
}

export default function ResultPage() {
  return <Suspense><ResultContent /></Suspense>
}
