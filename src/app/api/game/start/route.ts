import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { players, gameSessions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
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

    // Create game session
    const [session] = await db
      .insert(gameSessions)
      .values({ playerId: player.id })
      .returning()

    return NextResponse.json({ sessionId: session.id, alreadyPlayed: false })
  } catch (err) {
    console.error('Game start error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
