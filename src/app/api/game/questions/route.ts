import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { questions, gameSessions } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session')
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session' }, { status: 400 })
    }

    // Verify session exists and is not completed
    const session = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.id, Number(sessionId)))
      .limit(1)

    if (!session.length || session[0].completed) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
    }

    // Pick 1 random question per difficulty
    const easy = await db
      .select()
      .from(questions)
      .where(eq(questions.difficulty, 'easy'))
      .orderBy(sql`RANDOM()`)
      .limit(1)

    const medium = await db
      .select()
      .from(questions)
      .where(eq(questions.difficulty, 'medium'))
      .orderBy(sql`RANDOM()`)
      .limit(1)

    const hard = await db
      .select()
      .from(questions)
      .where(eq(questions.difficulty, 'hard'))
      .orderBy(sql`RANDOM()`)
      .limit(1)

    const rounds = [easy[0], medium[0], hard[0]]

    return NextResponse.json(
      rounds.map((q) => ({
        id: q.id,
        difficulty: q.difficulty,
        equation: q.equation,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
      }))
    )
  } catch (err) {
    console.error('Questions fetch error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
