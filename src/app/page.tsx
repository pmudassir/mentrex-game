'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function LandingPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [alreadyPlayed, setAlreadyPlayed] = useState(false)

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleaned = phone.replace(/\D/g, '')
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      setError('Enter a valid 10-digit mobile number')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleaned }),
      })
      const data = await res.json()
      if (data.alreadyPlayed) { setAlreadyPlayed(true); setLoading(false); return }
      if (!data.sessionId) { setError('Something went wrong. Please try again.'); setLoading(false); return }
      router.push(`/register?session=${data.sessionId}&phone=${cleaned}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (alreadyPlayed) {
    return (
      <div className="bg-background-light min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full text-center"
        >
          <div className="text-6xl mb-4">😄</div>
          <h2 className="text-xl font-bold text-warm-black mb-2">Already played!</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Each number gets one attempt. Check the leaderboard to see your rank!
          </p>
          <a
            href="/leaderboard"
            style={{ background: 'linear-gradient(to right, #FF4500, #FF8C00)' }}
            className="block w-full py-4 text-white font-extrabold rounded-xl shadow-lg text-center"
          >
            View Leaderboard →
          </a>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="bg-background-light min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl" />

      {/* Main Container */}
      <div className="relative w-full max-w-[380px] flex flex-col items-center gap-8 z-10">

        {/* Top Badge */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="bg-primary/10 text-primary px-4 py-1.5 rounded-full flex items-center gap-2 border border-primary/20"
        >
          <span className="material-symbols-outlined text-sm font-bold">bolt</span>
          <span className="text-xs font-bold uppercase tracking-wider">Mentrex Campaign</span>
        </motion.div>

        {/* Hero Content */}
        <motion.div
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center text-center"
        >
          <div className="text-[80px] mb-4">🧠</div>
          <h1 className="text-warm-black text-[36px] font-[900] leading-tight tracking-[-0.03em] mb-3">
            30-Second Brain Challenge
          </h1>
          <p className="text-warm-brown text-sm font-medium">
            Solve emoji puzzles. Win Amazon Gift Cards 🎁
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.18 }}
          className="w-full space-y-4"
        >
          <form onSubmit={handleStart} className="flex flex-col gap-2">
            <label className="text-xs font-bold text-warm-brown/70 uppercase tracking-widest ml-1">
              Enter Mobile Number
            </label>
            <div className="flex gap-2">
              <div className="flex items-center justify-center bg-orange-50 border-2 border-orange-100 px-3 py-4 rounded-xl text-warm-black font-bold">
                +91
              </div>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError('') }}
                placeholder="00000 00000"
                className={`flex-1 bg-orange-50 border-2 ${error ? 'border-red-400' : 'border-orange-100'} focus:border-primary focus:ring-0 rounded-xl px-4 py-4 text-lg font-bold text-warm-black placeholder:text-warm-brown/30`}
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs font-bold text-red-500 ml-1"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* CTA Button */}
            <button
              type="submit"
              disabled={loading}
              style={{ background: 'linear-gradient(to right, #FF4500, #FF8C00)' }}
              className="w-full hover:opacity-90 text-white font-extrabold py-5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-1"
            >
              {loading ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite', width: 18, height: 18 }} fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Checking...
                </>
              ) : (
                <>
                  Start Challenge
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Features/Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex flex-wrap justify-center gap-2"
        >
          <div className="bg-white border border-orange-100 px-3 py-2 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="material-symbols-outlined text-primary text-sm">bolt</span>
            <span className="text-[11px] font-bold text-warm-brown">30 seconds</span>
          </div>
          <div className="bg-white border border-orange-100 px-3 py-2 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="material-symbols-outlined text-primary text-sm">emoji_events</span>
            <span className="text-[11px] font-bold text-warm-brown">Leaderboard</span>
          </div>
          <div className="bg-white border border-orange-100 px-3 py-2 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="material-symbols-outlined text-primary text-sm">featured_seasonal_and_gifts</span>
            <span className="text-[11px] font-bold text-warm-brown">Real rewards</span>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
