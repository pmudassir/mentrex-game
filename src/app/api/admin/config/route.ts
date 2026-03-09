import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { config, dailyRewards } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { formatDate } from '@/lib/utils'

function checkAdmin(req: NextRequest): boolean {
  const auth = req.headers.get('x-admin-password')
  return auth === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const all = await db.select().from(config)
    const today = formatDate(new Date())
    const [todayRow] = await db
      .select()
      .from(dailyRewards)
      .where(eq(dailyRewards.date, today))
      .limit(1)

    const configMap = Object.fromEntries(all.map((c) => [c.key, c.value]))

    return NextResponse.json({
      ...configMap,
      winners_today: todayRow?.count ?? 0,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { key, value } = await req.json()

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Missing key or value' }, { status: 400 })
    }

    await db
      .insert(config)
      .values({ key, value: String(value) })
      .onConflictDoUpdate({ target: config.key, set: { value: String(value) } })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
