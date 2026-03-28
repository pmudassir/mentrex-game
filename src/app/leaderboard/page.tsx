'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface Entry {
  name: string
  school: string
  score: number
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((data) => { setEntries(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="bg-background-light font-display text-slate-900 min-h-screen">
      <div className="relative flex h-auto min-h-screen w-full flex-col max-w-md mx-auto bg-background-light overflow-x-hidden">

        {/* Header */}
        <div className="flex items-center bg-background-light p-4 pb-2 justify-between sticky top-0 z-10 border-b border-primary/10">
          <Link href="/" className="text-slate-900 flex size-12 shrink-0 items-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-12">Leaderboard</h2>
        </div>

        <div className="px-4 pb-3 pt-6">
          <h2 className="text-2xl font-bold leading-tight tracking-tight">Top players</h2>
          <p className="text-primary font-medium text-sm">Winner announced April 1st on Instagram</p>
        </div>

        {loading ? (
          <div className="px-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl animate-pulse bg-slate-200" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="px-4 mt-8 text-center">
            <div className="text-5xl mb-3">😴</div>
            <p className="font-medium text-slate-500">No scores yet. Be the first!</p>
          </div>
        ) : (
          <div>
            {/* Rank 1: Gold */}
            {entries[0] && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.06 }}
                className="px-4 py-2"
              >
                <div className="flex items-center justify-between gap-4 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-200 p-5 shadow-sm border border-yellow-300/30">
                  <div className="flex flex-row items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-2xl shadow-inner">🥇</div>
                    <div className="flex flex-col">
                      <p className="text-yellow-800 text-xs font-bold uppercase tracking-wider">Rank 1</p>
                      <p className="text-slate-900 text-lg font-bold">{entries[0].name.split(' ')[0]}</p>
                      <p className="text-slate-600 text-xs">{entries[0].school}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center rounded-lg bg-white/80 px-3 py-1.5 shadow-sm">
                    <span className="text-primary font-bold text-sm tracking-tight">{entries[0].score} pts</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Rank 2: Silver */}
            {entries[1] && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.12 }}
                className="px-4 py-2"
              >
                <div className="flex items-center justify-between gap-4 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 p-5 shadow-sm border border-slate-300/30">
                  <div className="flex flex-row items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-300 text-2xl shadow-inner">🥈</div>
                    <div className="flex flex-col">
                      <p className="text-slate-600 text-xs font-bold uppercase tracking-wider">Rank 2</p>
                      <p className="text-slate-900 text-lg font-bold">{entries[1].name.split(' ')[0]}</p>
                      <p className="text-slate-600 text-xs">{entries[1].school}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center rounded-lg bg-white/80 px-3 py-1.5 shadow-sm">
                    <span className="text-primary font-bold text-sm tracking-tight">{entries[1].score} pts</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Rank 3: Bronze */}
            {entries[2] && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.18 }}
                className="px-4 py-2"
              >
                <div className="flex items-center justify-between gap-4 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 p-5 shadow-sm border border-orange-300/30">
                  <div className="flex flex-row items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-300 text-2xl shadow-inner">🥉</div>
                    <div className="flex flex-col">
                      <p className="text-orange-800 text-xs font-bold uppercase tracking-wider">Rank 3</p>
                      <p className="text-slate-900 text-lg font-bold">{entries[2].name.split(' ')[0]}</p>
                      <p className="text-slate-600 text-xs">{entries[2].school}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center rounded-lg bg-white/80 px-3 py-1.5 shadow-sm">
                    <span className="text-primary font-bold text-sm tracking-tight">{entries[2].score} pts</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Rank 4+: White Cards */}
            {entries.length > 3 && (
              <div className="px-4 py-2 space-y-2">
                {entries.slice(3).map((entry, i) => (
                  <motion.div
                    key={i + 3}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: (i + 3) * 0.06 }}
                    className="flex items-center justify-between gap-4 rounded-lg bg-white p-4 shadow-sm border border-primary/5"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-8 text-center font-bold text-slate-400">#{i + 4}</span>
                      <div className="flex flex-col">
                        <p className="text-slate-900 font-bold">{entry.name.split(' ')[0]}</p>
                        <p className="text-slate-500 text-xs">{entry.school}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center rounded-lg bg-background-light px-3 py-1">
                      <span className="text-slate-600 font-medium text-xs">{entry.score} pts</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Play Now Button */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xs px-4">
          <Link
            href="/"
            style={{ background: '#ff4400' }}
            className="w-full text-white font-bold py-4 rounded-full shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 hover:opacity-90"
          >
            Play Now
            <span className="material-symbols-outlined">trending_flat</span>
          </Link>
        </div>

        <div className="h-32 bg-background-light"></div>
      </div>
    </div>
  )
}
