# Shark Tank Platform — Design Document (v1 — lean, final)

A discovery-only investor/entrepreneur matching platform with admin oversight. **v1 prioritises shipping the smallest demonstrable thing.** Heavier features have explicit slots in the v2 roadmap.

---

## 1. v1 scope at a glance

Three roles, one happy path:

> **Entrepreneur** signs up → admin approves → entrepreneur creates a Startup → posts a Pitch (PDF deck + optional financials) → **Investor** browses, views the deck, submits an **Offer** with a message → entrepreneur Accepts or Rejects → on Accept, **Admin** sees the deal in their queue and clicks **Mark Closed**. Email notifications fire at every key step.

That's the entire user-facing v1. Everything else is v2.

---

## 2. Locked-in decisions

| Area | Decision |
|---|---|
| Market | India only, INR |
| Deal types | Equity OR Revenue share/royalty (single column on Pitch + Offer) |
| Money | Discovery only — no payment integration ever in v1 |
| Pitch | Title, description, category (enum), ask amount, equity %, deck PDF, plus **optional financials: valuation, last-year profit, monthly burn rate** |
| KYC | Email + OTP at signup. Entrepreneur uploads startup-proof doc. Investor uploads PAN + fills investor profile (incl. optional `net_worth_inr`). Admin manually approves. |
| Visibility | Pitch summary is public to all approved investors. Deck unlocked on click (logged in AuditLog). |
| Negotiation | **Single Offer per investor per pitch.** Investor submits Offer → entrepreneur Accept/Reject. To "counter", investor withdraws and submits a new Offer. |
| Investor concurrency | Many investors can have open Offers on one pitch. Entrepreneur Accepts one; all other pending Offers on that pitch auto-transition to `withdrawn`. |
| Deal closure | Entrepreneur Accepts → Deal status `pending_admin` → admin clicks **Mark Closed**. No term sheet, no e-sign in v1. |
| Communication | None in-app. Offer carries a `message` field. Email at every state change. |
| Discovery | Hardcoded category enum + Postgres full-text search on title/description |
| Notifications | Email only (sync send via Resend). No in-app bell in v1. |
| Pitch lifecycle | draft → published (overwrite edits) → closed/withdrawn |
| Audit log | Only deal-relevant actions: signup approval, pitch publish/close, offer create/accept/reject, deal close, deck access |
| User → Startup | One User has many Startups; one Startup has many Pitches |
| File storage | Local `/uploads` (demo from laptop only). Cloud storage is v2. |
| Dev/deploy | Local docker-compose (Postgres + Redis). No production deploy in v1. |

---

## 3. Comparison to BiZvest (reference repo)

[BiZvest](https://github.com/Siddharththakur3617/BiZvest) is a Django + MySQL Shark-Tank-style app. We reviewed its schema and code structure. Key takeaways:

### What we are doing better

| Concern | BiZvest | Our v1 |
|---|---|---|
| Does an Offer know who made it? | ❌ no `investor_id` on `Offers` | ✅ `investor_user_id` FK |
| Deal state machine | ❌ no status column | ✅ `pending_admin → closed/cancelled` |
| Admin-gated signup | ❌ open registration | ✅ `User.status` workflow |
| KYC document upload + review | ❌ none | ✅ `KycDocument` table |
| Pitch as separate entity from Startup | ❌ a `startup` IS the listing | ✅ one Startup → many Pitches over time |
| Pitch lifecycle (draft / publish / withdraw) | ❌ | ✅ |
| File uploads (deck, KYC, proofs) | ❌ no file handling | ✅ `File` table + signed-token serving |
| Audit log | ❌ flat text file (`admin_actions.log`) | ✅ DB table with actor / before / after JSON |
| Real timestamps | ❌ `VARCHAR(10)` date columns | ✅ `datetime` everywhere |
| Editable pitches | ❌ | ✅ |
| Rate limiting / session management | ❌ | ✅ Redis-backed |
| Email notifications | ❌ | ✅ Resend |
| Full-text search | ❌ LIKE only | ✅ Postgres `tsvector` + GIN |
| Modern frontend (Next.js + React) | ❌ Django templates | ✅ |

### What we borrowed from them

Two genuine gaps in our previous draft. Both are small (4 nullable columns total, no new tables):

1. **Pitch financials** — `valuation_inr`, `last_year_profit_inr`, `burn_rate_inr_monthly`. Investors expect to see these. Added to `Pitch` (not `Startup`) because financials drift between funding rounds, so they belong to a specific pitch snapshot.
2. **Investor `net_worth_inr`** — nullable proxy for accreditation. Helps admin's approval decision. Added to `InvestorProfile`.

### What we deliberately did not borrow

- **Loan / debt deal type** (their `Deals.loan_given`, `loan_rate`, `loan_time`) — deferred to v2 roadmap. Our v1 covers equity + revenue-share only.
- **`choices` table** (investor sector interest with weight %) — premature. Our JSON `sector_interests` array filters today; weighted recommendations are a v2 problem.
- **Their `user` table design** (a row with `investor_id OR startup_id`) — fundamentally wrong; couples auth to role and makes role-switching impossible. Our `User` carries `role` as a column and links to a role-specific profile.

### Are we more complex than BiZvest? Honestly — yes, slightly

10 tables vs their 7. But:
- 3 of our extra tables (`KycDocument`, `AuditLog`, `File`) cover compliance and safety they completely skip.
- 1 (`Pitch` distinct from `Startup`) is a correctness gap in their model, not a feature.
- 1 (`EntrepreneurProfile` / `InvestorProfile` separation) is a schema-cleanliness choice you picked in Round 8.

We're not over-engineered relative to BiZvest — we're rigorous where they're handwavy. Their schema wouldn't pass an academic review; ours would.

---

## 4. Tech stack (v1)

### Frontend
- **Next.js 15** (App Router, plain JS) — SSR for pitch pages
- **Tailwind CSS** + **shadcn/ui** (works in JS via the CLI's JS template)
- **TanStack Query** — server-state caching
- **react-hook-form** + **Zod** — forms + runtime validation

### Backend
- **Node.js 20 LTS** (plain JS, ES modules)
- **Express** — routes, middleware
- **Prisma** — schema, migrations, seed
- **Zod** — input validation on every endpoint
- **bcrypt** — password hashing (cost 12)
- **express-session** + **connect-redis** — server-side sessions
- **express-rate-limit** + **rate-limit-redis** — per-IP and per-user throttling
- **Resend** — transactional email, called inline (no queue in v1)
- **multer** — multipart file uploads to local disk
- **helmet**, **cors** — standard security
- **pino** — structured logging (also where email failures land)

### Data
- **PostgreSQL 16** — single source of truth
- **Redis 7** — sessions + rate-limit counters only
- **Local filesystem** (`./uploads`) — files served via a signed-token endpoint that checks auth before streaming

### Dev
- **docker-compose.yml**: Postgres + Redis + Mailhog (catches dev emails so you don't burn Resend's free tier)
- **Prisma Migrate** + **Prisma seed** (the fake-data seeds you wanted)
- **ESLint** + **Prettier**

---

## 5. Architecture (v1)

```
┌────────────────────────────────────────────────────────┐
│              Browser  (Next.js, SSR + CSR)             │
└───────────────────┬────────────────────────────────────┘
                    │ HTTPS (cookies = session id)
                    ▼
            ┌────────────────┐
            │  Express API   │
            │  (Node.js)     │
            └──┬───────┬─────┘
               │       │
       ┌───────┘       └────────────┐
       │                            │
       ▼                            ▼
  ┌──────────┐               ┌─────────────┐
  │ Postgres │               │   Redis     │
  │ (Prisma) │               │  - sessions │
  └──────────┘               │  - rate-lim │
       │                     └─────────────┘
       │
       ▼ inline call
  ┌──────────┐
  │  Resend  │   (in dev: redirected to Mailhog)
  └──────────┘

  Static files: served from ./uploads via a signed-token
                Express route that checks auth first.
```

No workers, no queues, no WebSocket. One process for the API, one Next.js dev server, two containers (Postgres + Redis). That's the whole picture.

---

## 6. State machines (v1)

### 6.1 User
```
pending → approved → (suspended by admin)
        → rejected
```

### 6.2 Pitch
```
draft  ⇄  (editable)
  │
  └→ published  ⇄  (editable, overwrite)
        │
        ├→ closed     (an Offer was Accepted)
        └→ withdrawn  (entrepreneur action)
```

### 6.3 Offer
```
pending → accepted   (creates Deal; siblings auto → withdrawn)
        → rejected
        → withdrawn  (investor cancels their own offer)
```

### 6.4 Deal
```
pending_admin → closed       (admin clicks Mark Closed)
              → cancelled    (admin override)
```

---

## 7. The handful of flows that matter

### 7.1 Signup → approval
1. `POST /api/auth/signup` — email + password + role + (entrepreneur: startup-proof doc OR investor: PAN doc + profile fields). Inserts `User` (`status=pending`) + role profile + `KycDocument`.
2. Email OTP verification (`email_verified_at` set).
3. User sees "waiting for admin approval" screen.
4. Admin lists pending users, reviews docs, clicks Approve → `User.status=approved`, `AuditLog` row written, approval email sent.

### 7.2 Post a pitch
1. Approved entrepreneur creates a Startup (one-time per company).
2. `POST /api/pitches` — title, description, category, ask, equity %, deck file, optional financials. Pitch goes to `draft`. Entrepreneur can edit freely.
3. `POST /api/pitches/:id/publish` — flips to `published`. AuditLog written.

### 7.3 Investor finds and offers
1. `GET /api/pitches?category=&q=` — Postgres full-text search.
2. Click pitch → see summary. Click "View deck" → `POST /api/pitches/:id/access-deck` returns a 5-minute signed token; browser hits `/api/files/:id?token=...` which streams the local file. Access is recorded in AuditLog.
3. `POST /api/pitches/:id/offers` — amount, equity %, message. Offer goes to `pending`. Entrepreneur gets an email.

### 7.4 Accept → Admin closes
1. Entrepreneur clicks Accept on an Offer:
   - **single DB transaction**: set offer `accepted`; create Deal `pending_admin`; mark Pitch `closed`; set all sibling Offers on this Pitch to `withdrawn`; write AuditLog rows; commit.
   - After commit: send emails (investor "your offer was accepted", losers "the pitch is closed", admin "deal awaiting your close").
2. Admin sees the deal in their queue, clicks **Mark Closed** → Deal `closed`, AuditLog, congrats emails fire.

That's the whole product loop.

---

## 8. Security

- bcrypt cost 12, never log passwords
- HttpOnly, Secure, SameSite=Strict session cookies, 7-day TTL in Redis
- Per-form anti-CSRF tokens on state-changing routes
- Rate limits: 5 login attempts / 15 min / IP. 5 offers / day / investor. 1 signup / hour / IP.
- File uploads: server checks magic bytes + size cap (20 MB for decks). Filenames sanitised, stored with random UUIDs.
- Files served only via signed-token endpoint with auth check — no direct `/uploads/*` public route.
- Every API call goes through `requireRole(['investor'])` middleware + row-level ownership check.
- AuditLog rows written **in the same DB transaction** as the action they audit.
- pino redactor strips email, PAN, phone from log output.

---

## 9. v2 roadmap (everything we cut, with rough order)

Ordered by "smallest unlock per dollar":

1. **In-app notifications + bell** — add `Notification` table, poll `/api/notifications/unread` from the bell icon. ~0.5 day. No WebSocket yet.
2. **Cloudflare R2 for file storage** — swap local disk via the `storageService` abstraction. Unlocks deployment to Vercel/Render. ~0.5 day.
3. **Loan / debt deal type** (borrowed from BiZvest) — add `loan` to `deal_type` enum + nullable `loan_rate_pct`, `loan_term_months`. ~0.5 day.
4. **Counter-offers** — make `Offer` self-referential (`parent_offer_id`, `sender_role`). UI for the chain. ~2 days.
5. **PitchView analytics** — add the table + dashboard counter. ~0.5 day.
6. **Pitch edit history** — add `PitchVersion`, surface a diff viewer. ~1 day.
7. **Real-time updates** — Socket.io for live offer + notification push. ~1.5 days.
8. **Async messages / chat** — `ChatThread` + `Message` tables (use Socket.io from step 7). ~1.5 days.
9. **BullMQ + workers** — move email sending off the request thread. ~1 day.
10. **Term sheet generation + e-sign** — `TermSheetTemplate` + `TermSheet` + `Signature` + Puppeteer PDF. ~3 days.
11. **Admin-managed categories** — convert enum to FK to `Category` table. ~0.5 day.
12. **Weighted sector interest** (borrowed from BiZvest's `choices`) — split JSON array into a `InvestorSectorInterest` join table with a weight %. ~0.5 day.
13. **EmailLog table** — when delivery debugging becomes a real need.
14. **Subscription / commission billing** — only when you commercialise.

Each one slots in **without breaking v1** because v1's schema and code structure deliberately leave room (e.g. files always referenced via a `File` row even though storage is local).

---

## 10. Open questions still to answer

These don't block the schema but I want decisions before we code the screens:

1. **Dashboards** — what does each role land on after login? My default:
   - Investor: feed of latest published pitches + "My open offers"
   - Entrepreneur: "My pitches" + offers received
   - Admin: pending approvals + deals in `pending_admin`
2. **Withdrawal rules** — can an entrepreneur withdraw a Pitch that has pending Offers? My default: yes, and it auto-rejects them.
3. **Search ranking** — newest first, OR Postgres relevance score on text match? My default: relevance when there's a query, newest otherwise.
4. **Visual direction** — clean shadcn/ui defaults, OR specific brand? My default: shadcn defaults with a single accent colour you pick.

Answer when ready and I'll lock these in.
