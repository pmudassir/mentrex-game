import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { leads, coupons, gameSessions, dailyRewards, config } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { formatDate } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, name, phone, school, studentClass, interests } = body

    if (!sessionId || !name || !phone || !school || !studentClass) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get session and score
    const [session] = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.id, Number(sessionId)))
      .limit(1)

    if (!session || !session.completed) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
    }

    // Check if lead already submitted for this session
    const existingLead = await db
      .select()
      .from(leads)
      .where(eq(leads.sessionId, Number(sessionId)))
      .limit(1)

    if (existingLead.length > 0) {
      return NextResponse.json({ error: 'Already submitted' }, { status: 409 })
    }

    // Get score threshold config
    const thresholdConfig = await db
      .select()
      .from(config)
      .where(eq(config.key, 'score_threshold'))
      .limit(1)

    const threshold = thresholdConfig[0] ? Number(thresholdConfig[0].value) : 70
    const eligible = session.totalScore >= threshold

    // Save lead
    const [lead] = await db
      .insert(leads)
      .values({
        sessionId: session.id,
        playerId: session.playerId,
        name,
        phone,
        school,
        class: studentClass,
        interests: interests || [],
        score: session.totalScore,
      })
      .returning()

    if (!eligible) {
      return NextResponse.json({ eligible: false, score: session.totalScore })
    }

    // Check daily limit
    const today = formatDate(new Date())
    const limitConfig = await db
      .select()
      .from(config)
      .where(eq(config.key, 'daily_reward_limit'))
      .limit(1)

    const dailyLimit = limitConfig[0] ? Number(limitConfig[0].value) : 10

    const [todayRewards] = await db
      .select()
      .from(dailyRewards)
      .where(eq(dailyRewards.date, today))
      .limit(1)

    const todayCount = todayRewards?.count ?? 0

    if (todayCount >= dailyLimit) {
      return NextResponse.json({ eligible: true, limitReached: true, score: session.totalScore })
    }

    // Assign unused coupon
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(and(eq(coupons.isUsed, false), isNull(coupons.leadId)))
      .limit(1)

    if (!coupon) {
      return NextResponse.json({ eligible: true, limitReached: true, score: session.totalScore })
    }

    // Mark coupon as used
    await db
      .update(coupons)
      .set({ isUsed: true, leadId: lead.id, assignedAt: new Date() })
      .where(eq(coupons.id, coupon.id))

    // Update daily rewards count
    if (todayRewards) {
      await db
        .update(dailyRewards)
        .set({ count: todayCount + 1 })
        .where(eq(dailyRewards.date, today))
    } else {
      await db.insert(dailyRewards).values({ date: today, count: 1 })
    }

    return NextResponse.json({
      eligible: true,
      limitReached: false,
      coupon: coupon.code,
      score: session.totalScore,
    })
  } catch (err) {
    console.error('Lead submit error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
