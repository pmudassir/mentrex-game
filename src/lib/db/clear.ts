import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

async function clear() {
  console.log('🗑️  Clearing all test data...')

  // Delete in FK-safe order
  await db.delete(schema.coupons)
  console.log('  ✓ coupons cleared')

  await db.delete(schema.leads)
  console.log('  ✓ leads cleared')

  await db.delete(schema.gameSessions)
  console.log('  ✓ game sessions cleared')

  await db.delete(schema.dailyRewards)
  console.log('  ✓ daily rewards cleared')

  await db.delete(schema.players)
  console.log('  ✓ players cleared')

  console.log('\n✅ Done. Questions and config are untouched.')
}

clear().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
