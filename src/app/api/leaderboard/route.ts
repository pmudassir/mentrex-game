import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { leads } from '@/lib/db/schema'
import { desc, isNotNull } from 'drizzle-orm'

export async function GET() {
  try {
    const top = await db
      .select({
        name: leads.name,
        school: leads.school,
        score: leads.score,
      })
      .from(leads)
      .where(isNotNull(leads.score))
      .orderBy(desc(leads.score))
      .limit(10)

    return NextResponse.json(top)
  } catch (err) {
    console.error('Leaderboard error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
