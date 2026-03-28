# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint check

npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push schema to Neon DB
npm run db:seed      # Seed questions, coupons, and config
```

Required env vars in `.env.local`:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `ADMIN_PASSWORD` — plaintext password for /admin routes

## Architecture

This is a standalone Next.js 16 (App Router) campaign game. Players solve emoji brain puzzles, get scored, and optionally submit their info as leads. The goal is student lead generation for Mentrex.

### Game Flow

```
/ (phone gate) → POST /api/game/start
→ /play?session=ID → GET /api/game/questions → POST /api/game/submit
→ /result?session=ID&score=N → POST /api/leads
→ /leaderboard
```

One play per phone number — enforced via the `players` table (`hasPlayed` flag).

### Key Directories

- `src/app/` — Next.js App Router pages and API routes
- `src/app/api/game/` — `start`, `questions`, `submit` endpoints
- `src/app/api/admin/` — `leads`, `coupons`, `config` endpoints (password-protected via `x-admin-password` header)
- `src/app/api/leaderboard/` — top 10 leaderboard
- `src/app/api/leads/` — lead form submission + coupon assignment
- `src/lib/db/schema.ts` — full DB schema (source of truth)
- `src/lib/db/index.ts` — Drizzle + Neon client (lazy proxy pattern)
- `src/lib/utils.ts` — shared utilities

### Database Schema

Tables: `questions`, `players`, `gameSessions`, `leads`, `coupons`, `dailyRewards`, `config`

- `config` is a key/value table used for `scoreThreshold` and `dailyLimit` (editable via admin UI)
- `dailyRewards` tracks coupon issuance per date for the daily limit feature

### Scoring

- Correct answer: 30pts base
- Speed bonus: >80% time remaining = 10pts, >50% = 7pts, >25% = 4pts
- 3 rounds (one per difficulty): easy, medium, hard
- Max score: 120pts
- Reward threshold default: 70pts (configurable in `config` table)

### Admin

- Route: `/admin` — password-gated via `ADMIN_PASSWORD` env var
- No auth library — admin password is sent as `x-admin-password` request header
- Features: view/search leads, export CSV, add coupons, set daily limit and score threshold

### Design System

Tailwind CSS v4 with custom theme tokens in `globals.css`:
- Font: Lexend (`--font-display`)
- Primary color: `#ff4400`
- Background: `#f8f6f5` (light) / `#23140f` (dark)
- Answer feedback classes: `.answer-correct`, `.answer-wrong`, `.answer-dimmed`

UI components use Radix UI primitives + Framer Motion for animations.
