'use client'

import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface Question {
  id: number
  difficulty: 'easy' | 'medium' | 'hard'
  equation: string
  question: string
  options: string[]
  correctIndex: number
}

interface Answer {
  questionId: number
  answerIndex: number
  timeLeftMs: number
}

const TIMER_SECONDS = 30

const DIFFICULTY_CONFIG = {
  easy:   { label: 'Warm Up',     bg: 'bg-emerald-100', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  medium: { label: 'Getting Hot', bg: 'bg-amber-100',   text: 'text-amber-600',   dot: 'bg-amber-500' },
  hard:   { label: 'Brain Burn',  bg: 'bg-red-100',     text: 'text-red-600',     dot: 'bg-red-500' },
}

function PlayContent() {
  const router = useRouter()
  const params = useSearchParams()
  const sessionId = params.get('session')

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentRound, setCurrentRound] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [transitioning, setTransitioning] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeLeftRef = useRef(TIMER_SECONDS)

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  const advanceRound = useCallback((finalAnswers: Answer[]) => {
    const next = currentRound + 1
    if (next >= questions.length) {
      fetch('/api/game/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: Number(sessionId), answers: finalAnswers }),
      })
        .then((r) => r.json())
        .then((data) => router.push(`/result?session=${sessionId}&score=${data.totalScore}`))
    } else {
      setTimeout(() => {
        setCurrentRound(next)
        setSelected(null)
        setTimeLeft(TIMER_SECONDS)
        timeLeftRef.current = TIMER_SECONDS
        setTransitioning(false)
      }, 900)
    }
  }, [currentRound, questions.length, sessionId, router])

  const handleAnswer = useCallback((index: number) => {
    if (selected !== null || transitioning) return
    stopTimer()
    setSelected(index)
    setTransitioning(true)

    const q = questions[currentRound]
    const isCorrect = index === q.correctIndex
    const timeLeftMs = timeLeftRef.current * 1000

    if (isCorrect) {
      const ratio = timeLeftMs / (TIMER_SECONDS * 1000)
      const bonus = ratio > 0.8 ? 10 : ratio > 0.5 ? 7 : ratio > 0.25 ? 4 : 0
      setScore((s) => s + 30 + bonus)
    }

    const updated = [...answers, { questionId: q.id, answerIndex: index, timeLeftMs }]
    setAnswers(updated)
    setTimeout(() => advanceRound(updated), 1000)
  }, [selected, transitioning, questions, currentRound, answers, stopTimer, advanceRound])

  // Timer
  useEffect(() => {
    if (!questions.length || selected !== null) return
    setTimeLeft(TIMER_SECONDS)
    timeLeftRef.current = TIMER_SECONDS
    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 1
      setTimeLeft(timeLeftRef.current)
      if (timeLeftRef.current <= 0) { stopTimer(); handleAnswer(-1) }
    }, 1000)
    return stopTimer
  }, [currentRound, questions.length])

  useEffect(() => {
    if (!sessionId) return
    const controller = new AbortController()
    fetch(`/api/game/questions?session=${sessionId}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setQuestions(data); setLoading(false) })
      .catch((err) => { if (err.name !== 'AbortError') setLoading(false) })
    return () => controller.abort()
  }, [sessionId])

  if (!sessionId) { router.replace('/'); return null }

  if (loading) {
    return (
      <div className="bg-background-light min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="text-5xl mb-3">🧠</motion.div>
          <p className="font-medium text-sm text-slate-500">Loading challenge...</p>
        </div>
      </div>
    )
  }

  const q = questions[currentRound]
  if (!q) return null

  const diff = DIFFICULTY_CONFIG[q.difficulty]
  const progress = (timeLeft / TIMER_SECONDS) * 100
  const radius = 28
  const circ = 2 * Math.PI * radius
  const timerColor = timeLeft > 15 ? '#ff4400' : timeLeft > 8 ? '#f59e0b' : '#ef4444'

  return (
    <div className="bg-background-light min-h-screen">
      <div className="max-w-md mx-auto min-h-screen flex flex-col p-4">

        {/* Top Navigation / Progress Bar */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex gap-2">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`px-3 py-1 rounded-full border-2 text-xs font-bold ${
                  i === currentRound
                    ? 'border-primary text-primary bg-primary/5'
                    : i < currentRound
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-slate-200 text-slate-400'
                }`}
              >
                R{i + 1}
              </div>
            ))}
          </div>
          <div className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary text-primary font-bold text-sm">
            Score: {score}
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentRound}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col flex-1"
          >
            {/* Difficulty Badge */}
            <div className="flex justify-center mb-6">
              <span className={`inline-flex items-center px-4 py-1 rounded-full ${diff.bg} ${diff.text} text-xs font-bold tracking-wide uppercase`}>
                <span className={`w-2 h-2 rounded-full ${diff.dot} mr-2`}></span>
                {diff.label}
              </span>
            </div>

            {/* Timer Circle */}
            <div className="flex justify-center mb-8">
              <div className="relative flex items-center justify-center">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    className="text-slate-200"
                    cx="32" cy="32" fill="transparent" r={radius}
                    stroke="currentColor" strokeWidth="4"
                  />
                  <motion.circle
                    cx="32" cy="32" fill="transparent" r={radius}
                    stroke={timerColor}
                    strokeDasharray={circ}
                    strokeDashoffset={circ - (progress / 100) * circ}
                    strokeWidth="4"
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
                  />
                </svg>
                <span
                  className="absolute text-lg font-bold"
                  style={{ color: timerColor }}
                >
                  {timeLeft}s
                </span>
              </div>
            </div>

            {/* Equation Card */}
            <div
              className={`bg-white rounded-xl border-4 p-8 shadow-xl mb-8 relative overflow-hidden ${
                timeLeft <= 8 ? 'border-red-200' : 'border-primary/20'
              }`}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10"></div>
              <div className="font-mono space-y-4 text-center mb-8">
                {q.equation.split('\n').map((line, i) => (
                  <div key={i} className="text-3xl sm:text-4xl text-slate-800 flex items-center justify-center gap-2">
                    {line.split(/(\s+)/).filter(s => s.trim()).map((token, j) => (
                      <span
                        key={j}
                        style={{ fontWeight: token.match(/^\d+$/) ? 900 : 700 }}
                      >
                        {token}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-slate-600">{q.question}</p>
              </div>
            </div>

            {/* Answer Grid */}
            <div className="grid grid-cols-2 gap-4 mt-auto">
              {q.options.map((opt, i) => {
                const isSelected = selected === i
                const showResult = selected !== null
                const isCorrect = i === q.correctIndex

                let btnClass = 'aspect-square flex items-center justify-center text-3xl font-bold bg-white border-b-4 rounded-xl text-slate-800 transition-all active:translate-y-1'

                if (!showResult) {
                  btnClass += ' border-slate-200 hover:border-primary/50'
                } else if (isCorrect) {
                  btnClass += ' answer-correct border-green-400'
                } else if (isSelected) {
                  btnClass += ' answer-wrong border-red-400'
                } else {
                  btnClass += ' answer-dimmed border-slate-200'
                }

                return (
                  <motion.button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={selected !== null}
                    whileTap={{ scale: 0.96 }}
                    className={btnClass}
                  >
                    {opt}
                  </motion.button>
                )
              })}
            </div>

            {/* Hint / feedback */}
            <footer className="mt-8 flex justify-center h-7">
              <AnimatePresence mode="wait">
                {selected === null ? (
                  <motion.p
                    key="hint"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-slate-400 text-xs font-medium uppercase tracking-widest"
                  >
                    Tap the correct answer
                  </motion.p>
                ) : (
                  <motion.p
                    key="feedback"
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-sm font-bold"
                    style={{ color: selected === q.correctIndex ? '#16A34A' : '#DC2626' }}
                  >
                    {selected === q.correctIndex
                      ? '✓ Correct!'
                      : selected === -1
                      ? "⏱ Time's up!"
                      : `✗ Answer was ${q.options[q.correctIndex]}`}
                  </motion.p>
                )}
              </AnimatePresence>
            </footer>

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function PlayPage() {
  return <Suspense><PlayContent /></Suspense>
}
