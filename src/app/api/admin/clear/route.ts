import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { coupons, leads, gameSessions, dailyRewards, players } from '@/lib/db/schema'

export async function POST(req: NextRequest) {
  const password = req.headers.get('x-admin-password')
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await db.delete(coupons)
  await db.delete(leads)
  await db.delete(gameSessions)
  await db.delete(dailyRewards)
  await db.delete(players)

  return NextResponse.json({ success: true, message: 'All player data cleared.' })
}
