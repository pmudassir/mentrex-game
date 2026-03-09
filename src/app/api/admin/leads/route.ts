import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { leads, coupons } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'

function checkAdmin(req: NextRequest): boolean {
  const auth = req.headers.get('x-admin-password')
  return auth === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const allLeads = await db
      .select({
        id: leads.id,
        name: leads.name,
        phone: leads.phone,
        school: leads.school,
        class: leads.class,
        interests: leads.interests,
        score: leads.score,
        createdAt: leads.createdAt,
        couponCode: coupons.code,
      })
      .from(leads)
      .leftJoin(coupons, eq(coupons.leadId, leads.id))
      .orderBy(desc(leads.createdAt))

    return NextResponse.json(allLeads)
  } catch (err) {
    console.error('Admin leads error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
