'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Lead {
  id: number
  name: string
  phone: string
  school: string
  class: string
  interests: string[]
  score: number
  createdAt: string
  couponCode: string | null
}

interface Coupon {
  id: number
  code: string
  isUsed: boolean
  assignedAt: string | null
  leadId: number | null
  winnerName: string | null
  winnerPhone: string | null
  winnerSchool: string | null
}

interface CouponStats {
  total: number
  used: number
  available: number
  coupons: Coupon[]
}

type Tab = 'leads' | 'coupons' | 'settings'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [tab, setTab] = useState<Tab>('leads')
  const [leads, setLeads] = useState<Lead[]>([])
  const [couponStats, setCouponStats] = useState<CouponStats | null>(null)
  const [newCodes, setNewCodes] = useState('')
  const [dailyLimit, setDailyLimit] = useState('10')
  const [scoreThreshold, setScoreThreshold] = useState('70')
  const [winnersToday, setWinnersToday] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [search, setSearch] = useState('')

  const headers = { 'x-admin-password': password }

  const fetchData = async () => {
    const [leadsRes, couponsRes, configRes] = await Promise.all([
      fetch('/api/admin/leads', { headers }),
      fetch('/api/admin/coupons', { headers }),
      fetch('/api/admin/config', { headers }),
    ])
    if (leadsRes.ok) setLeads(await leadsRes.json())
    if (couponsRes.ok) {
      const d = await couponsRes.json()
      setCouponStats({ total: d.total, used: d.used, available: d.available, coupons: d.coupons ?? [] })
    }
    if (configRes.ok) {
      const d = await configRes.json()
      setDailyLimit(d.daily_reward_limit ?? '10')
      setScoreThreshold(d.score_threshold ?? '70')
      setWinnersToday(d.winners_today ?? 0)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/admin/leads', { headers: { 'x-admin-password': password } })
    if (res.ok) { setAuthed(true); setAuthError('') }
    else setAuthError('Wrong password')
  }

  useEffect(() => { if (authed) fetchData() }, [authed])

  const handleAddCoupons = async () => {
    const codes = newCodes.split(/[\n,]+/).map(c => c.trim()).filter(Boolean)
    if (!codes.length) return
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ codes }),
    })
    if (res.ok) { setNewCodes(''); await fetchData() }
  }

  const handleSaveConfig = async () => {
    setSaving(true)
    await Promise.all([
      fetch('/api/admin/config', { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'daily_reward_limit', value: dailyLimit }) }),
      fetch('/api/admin/config', { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'score_threshold', value: scoreThreshold }) }),
    ])
    setSaving(false)
    setSaveMsg('Saved!')
    setTimeout(() => setSaveMsg(''), 2000)
  }

  const exportCSV = () => {
    const hdr = ['Name', 'Phone', 'School', 'Class', 'Interests', 'Score', 'Score%', 'Coupon', 'Date']
    const rows = leads.map(l => [l.name, l.phone, l.school, l.class, (l.interests || []).join(';'), l.score, Math.round((l.score / 120) * 100) + '%', l.couponCode || '', new Date(l.createdAt).toLocaleDateString('en-IN')])
    const csv = [hdr, ...rows].map(r => r.map(String).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = url; a.download = `mentrex-leads-${new Date().toISOString().split('T')[0]}.csv`; a.click()
  }

  const winners = leads.filter(l => l.couponCode)
  const filtered = leads.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.school.toLowerCase().includes(search.toLowerCase()) ||
    l.phone.includes(search)
  )

  if (!authed) {
    return (
      <div className="bg-background-light min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-xl shadow-xl shadow-primary/5 border border-primary/10 max-w-xs w-full p-8"
        >
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🔐</div>
            <h1 className="text-xl font-bold">Admin Panel</h1>
            <p className="text-xs mt-1 text-slate-400">Mentrex Campaign Dashboard</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-primary outline-none transition-all ${authError ? 'border-red-400' : 'border-slate-200'}`}
            />
            {authError && <p className="text-sm text-red-500 font-medium">{authError}</p>}
            <button type="submit" style={{ background: 'linear-gradient(to right, #FF4500, #FF8C00)' }} className="w-full text-white font-bold py-3 rounded-xl">
              Login
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="bg-background-light font-display text-slate-900 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-light/80 backdrop-blur-md border-b border-primary/10 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <span>Mentrex Admin</span>
          </h1>
          <button
            onClick={exportCSV}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export CSV
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-6 pb-24">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Leads', value: leads.length.toLocaleString(), badge: '+recent', badgeClass: 'text-emerald-500 bg-emerald-500/10' },
            { label: 'Winners', value: winners.length, badge: winners.length > 0 ? `+${winners.length}` : '0', badgeClass: 'text-emerald-500 bg-emerald-500/10' },
            { label: "Today's Winners", value: winnersToday, badge: `${winnersToday}/${dailyLimit}`, badgeClass: winnersToday >= Number(dailyLimit) ? 'text-red-500 bg-red-500/10' : 'text-emerald-500 bg-emerald-500/10' },
            { label: 'Coupons Left', value: couponStats?.available ?? '—', badge: couponStats ? `-${couponStats.used}` : '—', badgeClass: 'text-red-500 bg-red-500/10' },
          ].map((card) => (
            <div key={card.label} className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{card.label}</p>
              <div className="flex items-end justify-between mt-1">
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                <span className={`text-xs font-bold flex items-center px-1.5 py-0.5 rounded ${card.badgeClass}`}>{card.badge}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-200/50 rounded-full w-full max-w-md mx-auto">
          {(['leads', 'coupons', 'settings'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-bold capitalize transition-all ${
                tab === t
                  ? 'bg-white shadow-sm text-primary'
                  : 'text-slate-600 hover:text-primary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* LEADS TAB */}
        {tab === 'leads' && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Recent Leads</h2>
              <span className="text-xs text-slate-500">Showing {winners.length} winners</span>
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, school, phone..."
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all"
            />

            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="bg-white rounded-xl p-10 text-center border border-primary/5">
                  <p className="text-slate-400">No leads yet.</p>
                </div>
              ) : filtered.map((lead) => {
                const scorePct = Math.round((lead.score / 120) * 100)
                const isWinner = !!lead.couponCode
                return (
                  <div key={lead.id} className="bg-white rounded-xl p-4 border border-primary/5 shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900">{lead.name}</h3>
                          {isWinner && (
                            <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                              Winner
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">+91 {lead.phone}</p>
                      </div>
                      <div className={`text-sm font-black px-2 py-1 rounded-lg ${isWinner ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {scorePct}%
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1 text-slate-600">
                        <span className="material-symbols-outlined text-sm">school</span>
                        {lead.school}
                      </div>
                      <div className="flex items-center gap-1 text-slate-600">
                        <span className="material-symbols-outlined text-sm">class</span>
                        Class {lead.class}
                      </div>
                    </div>
                    {lead.interests?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {lead.interests.map((int) => (
                          <span key={int} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">{int}</span>
                        ))}
                      </div>
                    )}
                    {lead.couponCode && (
                      <p className="text-xs font-bold font-mono text-primary">Code: {lead.couponCode}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.section>
        )}

        {/* COUPONS TAB */}
        {tab === 'coupons' && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Stats row */}
            {couponStats && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total', value: couponStats.total, cls: 'text-slate-900' },
                  { label: 'Claimed', value: couponStats.used, cls: 'text-red-600' },
                  { label: 'Available', value: couponStats.available, cls: 'text-emerald-600' },
                ].map((s) => (
                  <div key={s.label} className="bg-white p-4 rounded-xl border border-primary/5 text-center">
                    <div className={`text-2xl font-bold ${s.cls}`}>{s.value}</div>
                    <div className="text-xs mt-0.5 text-slate-400">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Available */}
            <div>
              <h3 className="text-md font-bold mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">confirmation_number</span>
                Available Codes
              </h3>
              <div className="bg-white rounded-xl divide-y divide-slate-100 overflow-hidden border border-primary/5">
                {!couponStats?.coupons.filter(c => !c.isUsed).length ? (
                  <div className="p-4">
                    <p className="text-sm text-slate-400">No available coupons.</p>
                  </div>
                ) : couponStats!.coupons.filter(c => !c.isUsed).map(c => (
                  <div key={c.id} className="p-4 flex items-center justify-between">
                    <code className="text-primary font-bold text-lg">{c.code}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(c.code)}
                      className="text-slate-400 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined">content_copy</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Claimed */}
            <div>
              <h3 className="text-md font-bold mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500">verified</span>
                Claimed Coupons
              </h3>
              <div className="space-y-3">
                {!couponStats?.coupons.filter(c => c.isUsed).length ? (
                  <div className="bg-white p-4 rounded-xl border border-primary/5">
                    <p className="text-sm text-slate-400">No coupons claimed yet.</p>
                  </div>
                ) : couponStats!.coupons.filter(c => c.isUsed).map(c => (
                  <div key={c.id} className="bg-white p-4 rounded-xl border border-primary/5 flex items-center justify-between">
                    <div>
                      <code className="text-slate-400 line-through text-xs">{c.code}</code>
                      <p className="text-sm font-bold">{c.winnerName ?? 'Unknown'}</p>
                      <p className="text-[10px] text-slate-400">
                        {c.assignedAt ? new Date(c.assignedAt).toLocaleString('en-IN') : '—'}
                      </p>
                    </div>
                    {c.winnerPhone && (
                      <a
                        href={`https://wa.me/91${c.winnerPhone}?text=Hi%20${encodeURIComponent(c.winnerName ?? '')}!%20Your%20Mentrex%20gift%20code%20is%20*${c.code}*.%20Congratulations!%20%F0%9F%8E%89`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-500/10 text-emerald-600 p-2 rounded-lg"
                      >
                        <span className="material-symbols-outlined">chat</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Add Coupons */}
            <div className="bg-white p-6 rounded-xl border border-primary/5 space-y-3">
              <h3 className="font-bold text-slate-900">Add New Coupons</h3>
              <textarea
                value={newCodes}
                onChange={(e) => setNewCodes(e.target.value)}
                placeholder={'MENTREX-AMZ-0001\nMENTREX-AMZ-0002'}
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 font-mono text-sm resize-none focus:ring-primary focus:border-primary outline-none"
              />
              <p className="text-[10px] text-slate-400">One code per line or comma-separated.</p>
              <button
                onClick={handleAddCoupons}
                className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary/20"
              >
                Add Coupons
              </button>
            </div>
          </motion.section>
        )}

        {/* SETTINGS TAB */}
        {tab === 'settings' && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white p-6 rounded-xl border border-primary/5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Daily Coupon Limit</label>
                <input
                  type="number"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  min={1} max={100}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-primary focus:border-primary outline-none"
                />
                <p className="text-[10px] text-slate-400">Maximum winners per 24-hour cycle. Today: {winnersToday}/{dailyLimit} used.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Winner Score Threshold</label>
                <input
                  type="number"
                  value={scoreThreshold}
                  onChange={(e) => setScoreThreshold(e.target.value)}
                  min={0} max={120}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-primary focus:border-primary outline-none"
                />
                <p className="text-[10px] text-slate-400">Minimum score required to automatically win a coupon (max 120).</p>
              </div>

              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 mt-4 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save System Settings'}
              </button>

              <AnimatePresence>
                {saveMsg && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium text-emerald-600">
                    ✓ {saveMsg}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.section>
        )}

      </main>

      {/* Bottom Nav (admin) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-2 flex items-center justify-between z-50">
        <button onClick={() => setTab('leads')} className={`flex flex-col items-center gap-1 ${tab === 'leads' ? 'text-primary' : 'text-slate-400'}`}>
          <span className="material-symbols-outlined">group</span>
          <span className="text-[10px] font-bold">Leads</span>
        </button>
        <button onClick={() => setTab('coupons')} className={`flex flex-col items-center gap-1 ${tab === 'coupons' ? 'text-primary' : 'text-slate-400'}`}>
          <span className="material-symbols-outlined">confirmation_number</span>
          <span className="text-[10px] font-bold">Coupons</span>
        </button>
        <button onClick={() => setTab('settings')} className={`flex flex-col items-center gap-1 ${tab === 'settings' ? 'text-primary' : 'text-slate-400'}`}>
          <span className="material-symbols-outlined">settings</span>
          <span className="text-[10px] font-bold">Settings</span>
        </button>
      </nav>
    </div>
  )
}
