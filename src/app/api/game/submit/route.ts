import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { questions, gameSessions, players } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'

interface Answer {
  questionId: number
  answerIndex: number
  timeLeftMs: number
}

const TOTAL_TIME_MS = 30000
const BASE_POINTS = 30

function calcSpeedBonus(timeLeftMs: number): number {
  const ratio = timeLeftMs / TOTAL_TIME_MS
  if (ratio > 0.8) return 10
  if (ratio > 0.5) return 7
  if (ratio > 0.25) return 4
  return 0
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, answers } = (await req.json()) as {
      sessionId: number
      answers: Answer[]
    }

    if (!sessionId || !answers?.length) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Verify session
    const [session] = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.id, sessionId))
      .limit(1)

    if (!session || session.completed) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
    }

    // Fetch correct answers from DB
    const questionIds = answers.map((a) => a.questionId)
    const dbQuestions = await db
      .select()
      .from(questions)
      .where(inArray(questions.id, questionIds))

    const questionMap = new Map(dbQuestions.map((q) => [q.id, q]))

    let baseScore = 0
    let speedBonus = 0

    for (const answer of answers) {
      const q = questionMap.get(answer.questionId)
      if (!q) continue

      if (answer.answerIndex === q.correctIndex) {
        baseScore += BASE_POINTS
        speedBonus += calcSpeedBonus(answer.timeLeftMs)
      }
    }

    const totalScore = baseScore + speedBonus

    // Update session
    await db
      .update(gameSessions)
      .set({
        baseScore,
        speedBonus,
        totalScore,
        completed: true,
        completedAt: new Date(),
      })
      .where(eq(gameSessions.id, sessionId))

    // Mark player as played
    await db
      .update(players)
      .set({ hasPlayed: true })
      .where(eq(players.id, session.playerId))

    return NextResponse.json({ baseScore, speedBonus, totalScore })
  } catch (err) {
    console.error('Submit error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
