import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { players, gameSessions } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

// Layer 3: IP rate limiting (in-memory, max 3 starts per IP per hour)
const ipAttempts = new Map<string, number[]>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowStart = now - 60 * 60 * 1000
  const attempts = (ipAttempts.get(ip) ?? []).filter((t) => t > windowStart)
  if (attempts.length >= 3) return false
  ipAttempts.set(ip, [...attempts, now])
  return true
}

export async function POST(req: NextRequest) {
  try {
    // Layer 1: Cookie check (no DB call needed)
    if (req.cookies.get('mentrex_played')?.value === '1') {
      return NextResponse.json({ alreadyPlayed: true })
    }

    // Layer 3: IP rate limit
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
    }

    const { phone } = await req.json()

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }

    // Check if player already exists
    const existing = await db
      .select()
      .from(players)
      .where(eq(players.phone, phone))
      .limit(1)

    if (existing.length > 0 && existing[0].hasPlayed) {
      return NextResponse.json({ alreadyPlayed: true })
    }

    // Create or get player
    let player = existing[0]
    if (!player) {
      const [newPlayer] = await db
        .insert(players)
        .values({ phone })
        .returning()
      player = newPlayer
    }

    // Layer 5: Reuse existing incomplete session < 30 min old (prevents parallel session abuse)
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000)
    const existingSessions = await db
      .select()
      .from(gameSessions)
      .where(and(eq(gameSessions.playerId, player.id), eq(gameSessions.completed, false)))
      .orderBy(desc(gameSessions.createdAt))
      .limit(1)

    if (
      existingSessions.length > 0 &&
      existingSessions[0].createdAt &&
      new Date(existingSessions[0].createdAt) > thirtyMinAgo
    ) {
      return NextResponse.json({ sessionId: existingSessions[0].id, alreadyPlayed: false })
    }

    // Create game session
    const [session] = await db
      .insert(gameSessions)
      .values({ playerId: player.id })
      .returning()

    return NextResponse.json({ sessionId: session.id, alreadyPlayed: false })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Game start error:', message, err)
    return NextResponse.json({ error: 'Server error', detail: message }, { status: 500 })
  }
}
