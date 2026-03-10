'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

type RewardState =
  | { status: 'loading' }
  | { status: 'won'; coupon: string }
  | { status: 'limit' }
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

function ResultContent() {
  const params = useSearchParams()
  const sessionId = params.get('session')
  const score = Number(params.get('score') ?? 0)
  const max = 120
  const accuracy = Math.round((score / max) * 100)

  const [reward, setReward] = useState<RewardState>({ status: 'loading' })

  // Auto-submit lead on mount using registration data from sessionStorage
  useEffect(() => {
    if (!sessionId) return
    const stored = sessionStorage.getItem(`reg_${sessionId}`)
    // If stored is missing (e.g. already submitted), stay on loading — don't flash error
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
        // Only remove after confirmed submit
        sessionStorage.removeItem(`reg_${sessionId}`)
        // Layer 2: Mark as played in localStorage so landing page can block instantly
        try { localStorage.setItem('mentrex_played', '1') } catch {}
        if (!data.eligible) setReward({ status: 'below' })
        else if (data.limitReached) setReward({ status: 'limit' })
        else setReward({ status: 'won', coupon: data.coupon })
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setReward({ status: 'error' })
      })

    // StrictMode cleanup: abort the first fetch so only the second run's fetch goes through
    return () => controller.abort()
  }, [sessionId])

  // Score arc
  const arcDeg = (score / max) * 0.75 * 360

  return (
    <div className="bg-background-light font-display text-slate-900 min-h-screen flex flex-col">
      {reward.status === 'won' && <Confetti />}

      {/* Header */}
      <header className="flex items-center bg-white p-4 border-b border-primary/10">
        <Link href="/" className="text-primary flex size-10 shrink-0 items-center justify-center cursor-pointer">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h2 className="text-lg font-bold flex-1 text-center pr-10">Result &amp; Reward</h2>
      </header>

      <main className="flex-1 px-6 py-8 flex flex-col items-center">

        {/* Score Visualization */}
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

        {/* Reward result */}
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
              <p className="text-sm font-medium">Checking your reward...</p>
            </motion.div>
          )}

          {reward.status === 'won' && (
            <motion.div
              key="won"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 160 }}
              className="w-full max-w-sm bg-white rounded-2xl p-6 border border-primary/20 text-center"
            >
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="text-2xl font-bold mb-1">Congratulations!</h3>
              <p className="text-slate-500 text-sm mb-6">Your reward has been unlocked</p>
              <div className="inline-block px-4 py-1 bg-primary text-white text-xs font-bold rounded-full mb-6 uppercase tracking-widest">
                Score: {score} / {max}
              </div>
              <div className="border-2 border-dashed border-amber-500 bg-amber-50 rounded-xl p-6">
                <p className="text-xs font-bold text-amber-600 mb-2 uppercase tracking-wider">Reward Code</p>
                <div className="flex items-center justify-between gap-4">
                  <code className="text-2xl font-mono font-bold text-slate-800">{reward.coupon}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(reward.coupon)}
                    className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-amber-600"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                    Copy
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                * Amazon gift card will be sent to your WhatsApp within 24 hours.
              </p>
              <Link href="/leaderboard" className="mt-6 inline-flex items-center gap-2 text-primary font-bold hover:underline">
                View Leaderboard
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </motion.div>
          )}

          {reward.status === 'limit' && (
            <motion.div
              key="limit"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 160 }}
              className="w-full max-w-sm bg-white rounded-2xl p-8 border border-primary/20 text-center"
            >
              <div className="text-5xl mb-3">😅</div>
              <h3 className="text-2xl font-bold mb-2">Not this time!</h3>
              <p className="text-sm text-slate-500 mb-6">
                Great score of <strong className="text-primary">{score}</strong>! Today&apos;s rewards are all claimed. Come back tomorrow!
              </p>
              <Link href="/leaderboard" style={{ background: 'linear-gradient(to right, #FF4500, #FF8C00)' }} className="inline-flex items-center gap-2 text-white font-bold py-3 px-6 rounded-xl">
                See Leaderboard →
              </Link>
            </motion.div>
          )}

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
                You need <strong>70+</strong> to qualify for rewards. You scored {score}!
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
