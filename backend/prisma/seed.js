// Seed script — creates realistic fake data for development
// Run: node prisma/seed.js
// (after npx prisma migrate dev has run)

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const DEMO_PASSWORD = 'Demo1234!'  // every seeded account uses this

async function main() {
  console.log('🌱  Seeding database...')

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10)

  // ── 1. Admin ────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.test' },
    update: {},
    create: {
      name: 'Platform Admin',
      email: 'admin@demo.test',
      passwordHash: hash,
      role: 'admin',
      status: 'approved',
    },
  })
  console.log('  ✔  Admin:', admin.email)

  // ── 2. Investors ─────────────────────────────────────────────
  const investors = await Promise.all([
    prisma.user.upsert({
      where: { email: 'arjun@demo.test' },
      update: {},
      create: {
        name: 'Arjun Mehta',
        email: 'arjun@demo.test',
        passwordHash: hash,
        role: 'investor',
        status: 'approved',
        contactPhone: '+91-9876500001',
      },
    }),
    prisma.user.upsert({
      where: { email: 'priya@demo.test' },
      update: {},
      create: {
        name: 'Priya Nair',
        email: 'priya@demo.test',
        passwordHash: hash,
        role: 'investor',
        status: 'approved',
        contactPhone: '+91-9876500002',
      },
    }),
    prisma.user.upsert({
      where: { email: 'ravi@demo.test' },
      update: {},
      create: {
        name: 'Ravi Shankar',
        email: 'ravi@demo.test',
        passwordHash: hash,
        role: 'investor',
        status: 'pending',   // intentionally pending — to demo admin approval flow
        contactPhone: '+91-9876500003',
      },
    }),
  ])
  console.log('  ✔  Investors:', investors.map(i => i.email).join(', '))

  // ── 3. Startups ──────────────────────────────────────────────
  const startups = await Promise.all([
    prisma.user.upsert({
      where: { email: 'kavya@demo.test' },
      update: {},
      create: {
        name: 'Kavya Reddy',
        email: 'kavya@demo.test',
        passwordHash: hash,
        role: 'startup',
        status: 'approved',
        contactPhone: '+91-9876500004',
      },
    }),
    prisma.user.upsert({
      where: { email: 'nikhil@demo.test' },
      update: {},
      create: {
        name: 'Nikhil Joshi',
        email: 'nikhil@demo.test',
        passwordHash: hash,
        role: 'startup',
        status: 'approved',
        contactPhone: '+91-9876500005',
      },
    }),
    prisma.user.upsert({
      where: { email: 'meera@demo.test' },
      update: {},
      create: {
        name: 'Meera Iyer',
        email: 'meera@demo.test',
        passwordHash: hash,
        role: 'startup',
        status: 'pending',   // pending — to demo admin approval flow
        contactPhone: '+91-9876500006',
      },
    }),
  ])
  console.log('  ✔  Startups:', startups.map(s => s.email).join(', '))

  // ── 4. Pitches (published) ───────────────────────────────────
  // Only approved startups can have published pitches
  const [kavya, nikhil] = startups

  const pitches = await Promise.all([
    prisma.pitch.upsert({
      where: { id: 'pitch-seed-001' },
      update: {},
      create: {
        id: 'pitch-seed-001',
        startupId: kavya.id,
        title: 'AgriLend — crop loans in 24 hours',
        problem: 'Small farmers in rural India wait 3–6 months for bank loans, missing the sowing window.',
        solution: 'Mobile-first lending platform using satellite crop-health data to approve micro-loans in under 24 hours.',
        fundingAmount: 5000000n,       // ₹50 lakh
        equityPercent: 8.0,
        domain: 'FinTech',
        status: 'published',
        publishedAt: new Date(),
      },
    }),
    prisma.pitch.upsert({
      where: { id: 'pitch-seed-002' },
      update: {},
      create: {
        id: 'pitch-seed-002',
        startupId: kavya.id,
        title: 'EduTrack — attendance + progress for rural schools',
        problem: 'Rural school teachers track attendance in paper registers; no data for intervention.',
        solution: 'Offline-first Android app that syncs when connectivity is available. Auto-generates progress reports for parents.',
        fundingAmount: 2000000n,       // ₹20 lakh
        equityPercent: 12.0,
        domain: 'EdTech',
        status: 'draft',               // draft — to demo the draft → publish flow
      },
    }),
    prisma.pitch.upsert({
      where: { id: 'pitch-seed-003' },
      update: {},
      create: {
        id: 'pitch-seed-003',
        startupId: nikhil.id,
        title: 'FoodCycle — surplus food redistribution',
        problem: 'Restaurants throw away 30–40% of food daily. Food banks have no visibility into what is available.',
        solution: 'Real-time surplus listing app — restaurant lists surplus at 6 pm; NGO driver picks up before 8 pm.',
        fundingAmount: 3500000n,       // ₹35 lakh
        equityPercent: 10.0,
        domain: 'D2C',
        status: 'published',
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),  // 2 days ago
      },
    }),
    prisma.pitch.upsert({
      where: { id: 'pitch-seed-004' },
      update: {},
      create: {
        id: 'pitch-seed-004',
        startupId: nikhil.id,
        title: 'CliniqAI — AI triage for primary health clinics',
        problem: 'PHC doctors see 80+ patients/day; no decision support for rare presentations.',
        solution: 'LLM-powered symptom checker trained on Indian disease burden data. Flags high-risk cases.',
        fundingAmount: 8000000n,       // ₹80 lakh
        equityPercent: 15.0,
        domain: 'HealthTech',
        status: 'published',
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),  // 5 days ago
      },
    }),
    prisma.pitch.upsert({
      where: { id: 'pitch-seed-005' },
      update: {},
      create: {
        id: 'pitch-seed-005',
        startupId: kavya.id,
        title: 'TalentBridge — campus to corporate in 90 days',
        problem: 'Tier-2/3 college graduates are unemployable without upskilling. Companies can\'t find enough ready candidates.',
        solution: 'Bootcamp + stipend + job guarantee model. Employer pays the bootcamp fee post-placement.',
        fundingAmount: 10000000n,      // ₹1 crore
        equityPercent: 7.5,
        domain: 'SaaS',
        status: 'published',
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),  // yesterday
      },
    }),
  ])
  console.log('  ✔  Pitches:', pitches.map(p => p.title).join('\n              '))

  // ── 5. Interests ─────────────────────────────────────────────
  const [arjun, priya] = investors

  const interest1 = await prisma.interest.upsert({
    where: { id: 'interest-seed-001' },
    update: {},
    create: {
      id: 'interest-seed-001',
      investorId: arjun.id,
      pitchId: 'pitch-seed-001',
      proposedAmount: 4500000n,
      proposedEquityPct: 9.0,
      message: 'I have backed 3 fintech startups before. Happy to intro you to NABARD contacts.',
      status: 'pending',
    },
  })

  const interest2 = await prisma.interest.upsert({
    where: { id: 'interest-seed-002' },
    update: {},
    create: {
      id: 'interest-seed-002',
      investorId: priya.id,
      pitchId: 'pitch-seed-003',
      proposedAmount: 3500000n,
      proposedEquityPct: 10.0,
      message: 'Love the supply-chain angle. I run a D2C distribution network and can open doors.',
      status: 'accepted',
      respondedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  })

  console.log('  ✔  Interests seeded')

  // ── 6. Negotiation (for the accepted interest) ────────────────
  await prisma.negotiation.upsert({
    where: { interestId: interest2.id },
    update: {},
    create: {
      pitchId: 'pitch-seed-003',
      investorId: priya.id,
      startupId: nikhil.id,
      interestId: interest2.id,
      status: 'open',
    },
  })
  console.log('  ✔  Negotiation seeded (pitch-seed-003 × Priya)')

  console.log('\n✅  Seed complete.')
  console.log('   Login with any of these accounts (password: Demo1234!)')
  console.log('   admin@demo.test  |  arjun@demo.test  |  priya@demo.test')
  console.log('   kavya@demo.test  |  nikhil@demo.test')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
