import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { coupons, leads } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

function checkAdmin(req: NextRequest): boolean {
  const auth = req.headers.get('x-admin-password')
  return auth === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Join coupons with leads to get winner details for claimed coupons
    const all = await db
      .select({
        id: coupons.id,
        code: coupons.code,
        isUsed: coupons.isUsed,
        assignedAt: coupons.assignedAt,
        leadId: coupons.leadId,
        winnerName: leads.name,
        winnerPhone: leads.phone,
        winnerSchool: leads.school,
      })
      .from(coupons)
      .leftJoin(leads, eq(leads.id, coupons.leadId))
      .orderBy(coupons.id)

    const total = all.length
    const used = all.filter((c) => c.isUsed).length
    const available = total - used

    return NextResponse.json({ total, used, available, coupons: all })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { codes } = await req.json()

    if (!Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json({ error: 'Provide an array of codes' }, { status: 400 })
    }

    const values = codes.map((code: string) => ({ code: code.trim().toUpperCase() }))
    const inserted = await db
      .insert(coupons)
      .values(values)
      .onConflictDoNothing()
      .returning()

    return NextResponse.json({ inserted: inserted.length })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
