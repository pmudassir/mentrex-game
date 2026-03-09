'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function RegisterContent() {
  const router = useRouter()
  const params = useSearchParams()
  const sessionId = params.get('session')
  const phone = params.get('phone') ?? ''

  const [form, setForm] = useState({
    name: '',
    school: '',
    studentClass: '11',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Please enter your name')
    if (!form.school.trim()) return setError('Please enter your school name')

    setError('')
    setLoading(true)
    sessionStorage.setItem(`reg_${sessionId}`, JSON.stringify({ ...form, phone, interests: [] }))
    router.push(`/play?session=${sessionId}`)
  }

  return (
    <div className="bg-background-light min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">

        {/* Progress Dots */}
        <div className="flex justify-center items-center space-x-4 mb-8">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-primary/20"></div>
            <span className="text-[10px] mt-1 font-medium text-primary uppercase tracking-wider">Form</span>
          </div>
          <div className="w-12 h-px bg-slate-300"></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-slate-300"></div>
            <span className="text-[10px] mt-1 font-medium text-slate-400 uppercase tracking-wider">Play</span>
          </div>
          <div className="w-12 h-px bg-slate-300"></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-slate-300"></div>
            <span className="text-[10px] mt-1 font-medium text-slate-400 uppercase tracking-wider">Result</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-xl shadow-primary/5 border border-primary/10 p-6 md:p-8">
          <header className="mb-8">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Before we begin... <span className="text-xl">✨</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">Enter details to claim reward &amp; join leaderboard</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Inputs Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">WhatsApp Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">+91</span>
                  <input
                    type="tel"
                    value={phone}
                    readOnly
                    className="w-full pl-14 pr-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">School Name</label>
                <input
                  type="text"
                  value={form.school}
                  onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
                  placeholder="Your school or institution"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Class Toggle */}
            <div>
              <label className="block text-sm font-medium mb-3 text-slate-700">Current Class</label>
              <div className="grid grid-cols-2 gap-4">
                {['11', '12'].map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, studentClass: cls }))}
                    className={`py-4 px-4 rounded-xl border-2 font-semibold flex flex-col items-center justify-center transition-all ${
                      form.studentClass === cls
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-primary/30'
                    }`}
                  >
                    Class {cls}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm font-medium text-red-500">{error}</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{ background: 'linear-gradient(to right, #ff4400, #ff6600)' }}
              className="w-full py-4 text-white font-bold rounded-xl shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Starting...' : (
                <>
                  Let&apos;s Play!
                  <span className="material-icons">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  )
}
