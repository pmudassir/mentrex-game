import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  integer,
  pgEnum,
  json,
} from 'drizzle-orm/pg-core'

export const difficultyEnum = pgEnum('difficulty', ['easy', 'medium', 'hard'])

export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  difficulty: difficultyEnum('difficulty').notNull(),
  equation: text('equation').notNull(),
  question: text('question').notNull(),
  options: json('options').$type<string[]>().notNull(),
  correctIndex: integer('correct_index').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  phone: text('phone').unique().notNull(),
  hasPlayed: boolean('has_played').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const gameSessions = pgTable('game_sessions', {
  id: serial('id').primaryKey(),
  playerId: integer('player_id')
    .references(() => players.id)
    .notNull(),
  baseScore: integer('base_score').default(0).notNull(),
  speedBonus: integer('speed_bonus').default(0).notNull(),
  totalScore: integer('total_score').default(0).notNull(),
  completed: boolean('completed').default(false).notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => gameSessions.id),
  playerId: integer('player_id').references(() => players.id),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  school: text('school').notNull(),
  class: text('class').notNull(),
  interests: json('interests').$type<string[]>().notNull().default([]),
  score: integer('score').default(0),
  createdAt: timestamp('created_at').defaultNow(),
})

export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: text('code').unique().notNull(),
  isUsed: boolean('is_used').default(false).notNull(),
  leadId: integer('lead_id').references(() => leads.id),
  assignedAt: timestamp('assigned_at'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const dailyRewards = pgTable('daily_rewards', {
  id: serial('id').primaryKey(),
  date: text('date').notNull().unique(),
  count: integer('count').default(0).notNull(),
})

export const config = pgTable('config', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})
