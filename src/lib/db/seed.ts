import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

async function seed() {
  console.log('🌱 Seeding database...')

  // Clear old questions before inserting new ones
  await db.delete(schema.questions)

  // Seed questions (much simpler — solvable in under 30s)
  await db.insert(schema.questions).values([
    // Easy — single equation, direct solve
    {
      difficulty: 'easy',
      equation: '🍎 + 🍎 = 10',
      question: 'What is 🍎 ?',
      options: ['4', '5', '6', '7'],
      correctIndex: 1,
    },
    {
      difficulty: 'easy',
      equation: '🐶 + 🐶 + 🐶 = 9',
      question: 'What is 🐶 ?',
      options: ['2', '3', '4', '5'],
      correctIndex: 1,
    },
    {
      difficulty: 'easy',
      equation: '🌟 × 2 = 14',
      question: 'What is 🌟 ?',
      options: ['5', '6', '7', '8'],
      correctIndex: 2,
    },
    // Medium — two equations, simple substitution
    {
      difficulty: 'medium',
      equation: '🍕 + 🍕 = 8\n🍕 + 🌮 = 9',
      question: 'What is 🌮 ?',
      options: ['3', '4', '5', '6'],
      correctIndex: 2,
    },
    {
      difficulty: 'medium',
      equation: '⭐ + ⭐ + ⭐ = 12\n⭐ + 🌙 = 7',
      question: 'What is 🌙 ?',
      options: ['2', '3', '4', '5'],
      correctIndex: 1,
    },
    {
      difficulty: 'medium',
      equation: '🐱 + 🐱 = 6\n🐱 + 🐶 = 8',
      question: 'What is 🐶 ?',
      options: ['3', '4', '5', '6'],
      correctIndex: 2,
    },
    // Hard — two equations, slightly bigger numbers
    {
      difficulty: 'hard',
      equation: '🍊 + 🍊 = 10\n🍎 + 🍊 = 9',
      question: 'What is 🍎 ?',
      options: ['3', '4', '5', '6'],
      correctIndex: 1,
    },
    {
      difficulty: 'hard',
      equation: '🔥 + 🔥 = 12\n🔥 + 💧 = 10',
      question: 'What is 💧 ?',
      options: ['3', '4', '5', '6'],
      correctIndex: 1,
    },
    {
      difficulty: 'hard',
      equation: '🐘 × 3 = 15\n🐘 + 🦁 = 9',
      question: 'What is 🦁 ?',
      options: ['3', '4', '5', '6'],
      correctIndex: 1,
    },
  ])

  // Seed initial config
  await db.insert(schema.config).values([
    { key: 'daily_reward_limit', value: '10' },
    { key: 'score_threshold', value: '70' },
  ]).onConflictDoNothing()

  // Seed sample coupons
  await db.insert(schema.coupons).values([
    { code: 'MENTREX-AMZ-1021' },
    { code: 'MENTREX-AMZ-2382' },
    { code: 'MENTREX-AMZ-5510' },
    { code: 'MENTREX-AMZ-7734' },
    { code: 'MENTREX-AMZ-9941' },
    { code: 'MENTREX-AMZ-3847' },
    { code: 'MENTREX-AMZ-6192' },
    { code: 'MENTREX-AMZ-4455' },
    { code: 'MENTREX-AMZ-8823' },
    { code: 'MENTREX-AMZ-7291' },
  ]).onConflictDoNothing()

  console.log('✅ Seed complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
