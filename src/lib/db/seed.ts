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

  // Seed questions — medium difficulty, solvable in 15–25s for sharp students
  await db.insert(schema.questions).values([
    // Easy — single equation, 1–2 steps
    {
      difficulty: 'easy',
      equation: '🍎 + 🍎 + 🍎 = 15',
      question: 'What is 🍎 ?',
      options: ['3', '4', '5', '6'],
      correctIndex: 2,
    },
    {
      difficulty: 'easy',
      equation: '🐶 × 4 = 24',
      question: 'What is 🐶 ?',
      options: ['4', '5', '6', '7'],
      correctIndex: 2,
    },
    {
      difficulty: 'easy',
      equation: '🌟 × 🌟 = 25',
      question: 'What is 🌟 ?',
      options: ['3', '4', '5', '6'],
      correctIndex: 2,
    },
    // Medium — two equations, substitute to find the unknown
    {
      difficulty: 'medium',
      equation: '🍕 + 🌮 = 11\n🍕 - 🌮 = 3',
      question: 'What is 🌮 ?',
      options: ['3', '4', '5', '6'],
      correctIndex: 1,
    },
    {
      difficulty: 'medium',
      equation: '🐱 × 🐱 = 16\n🐱 + 🐶 = 11',
      question: 'What is 🐶 ?',
      options: ['5', '6', '7', '8'],
      correctIndex: 2,
    },
    {
      difficulty: 'medium',
      equation: '🌙 + 🌙 = 🌟\n🌟 - 🌙 = 5',
      question: 'What is 🌟 ?',
      options: ['8', '10', '12', '14'],
      correctIndex: 1,
    },
    // Hard — three unknowns or non-obvious factoring
    {
      difficulty: 'hard',
      equation: '🍊 + 🍎 = 11\n🍎 + 🍋 = 7\n🍊 + 🍋 = 10',
      question: 'What is 🍊 ?',
      options: ['5', '6', '7', '8'],
      correctIndex: 2,
    },
    {
      difficulty: 'hard',
      equation: '🔥 × 💧 = 24\n🔥 + 💧 = 11\n🔥 > 💧',
      question: 'What is 🔥 ?',
      options: ['6', '7', '8', '9'],
      correctIndex: 2,
    },
    {
      difficulty: 'hard',
      equation: '🐘 + 🦁 + 🐯 = 20\n🐘 = 🦁 + 2\n🦁 = 🐯 + 3',
      question: 'What is 🐘 ?',
      options: ['7', '8', '9', '10'],
      correctIndex: 2,
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
