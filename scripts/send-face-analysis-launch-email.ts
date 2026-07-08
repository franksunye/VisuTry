/**
 * Send AI Face Analysis launch announcement via Tencent Exmail.
 *
 * Usage:
 *   npx tsx scripts/send-face-analysis-launch-email.ts --test-to you@example.com
 *   npx tsx scripts/send-face-analysis-launch-email.ts --dry-run
 *   npx tsx scripts/send-face-analysis-launch-email.ts --dry-run --production
 *   npx tsx scripts/send-face-analysis-launch-email.ts --limit 50
 *   npx tsx scripts/send-face-analysis-launch-email.ts --resume
 *
 * Options:
 *   --test-to <email>   Send one test message and exit
 *   --dry-run           Preview recipient count / sample only
 *   --production        Load DATABASE_URL from .vercel/.env.production.local
 *   --limit <n>         Max recipients this run
 *   --resume            Skip emails already logged as sent
 *   --delay-ms <n>      Pause between sends (default 3000)
 */

import * as dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { sendMail } from './mail'

dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true })
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true, quiet: true })

const FROM_EMAIL = 'support@visutry.com'
const SUBJECT = 'New on VisuTry: AI Face Analysis for Glasses'
const CAMPAIGN_AUDIENCE_CUTOFF = new Date('2026-06-15T05:38:58.358Z')
const BODY_TEMPLATE_PATH = path.resolve(
  process.cwd(),
  'scripts/templates/face-analysis-launch-en.txt'
)
const SENT_LOG_PATH = path.resolve(
  process.cwd(),
  'scripts/logs/face-analysis-launch-sent.json'
)

type SentLog = {
  startedAt: string
  updatedAt: string
  sent: Array<{ userId: string; email: string; messageId?: string; sentAt: string }>
  failed: Array<{ userId: string; email: string; error: string; failedAt: string }>
}

function parseArg(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name)
}

function extractFirstName(name: string | null, email: string): string {
  if (name) {
    const cleanName = name.startsWith('@') ? name.slice(1) : name
    const firstName = cleanName.split(' ')[0]
    if (firstName && !/^\d+$/.test(firstName)) {
      return firstName
    }
  }

  const emailPrefix = email.split('@')[0]
  const firstPart = emailPrefix.split(/[._-]/)[0]
  if (firstPart && firstPart.length > 1) {
    return firstPart.charAt(0).toUpperCase() + firstPart.slice(1).toLowerCase()
  }

  return 'there'
}

function loadBodyTemplate(): string {
  return fs.readFileSync(BODY_TEMPLATE_PATH, 'utf8')
}

function renderBody(template: string, firstName: string): string {
  return template.replace(/\{\{FIRST_NAME\}\}/g, firstName)
}

function loadProductionDatabaseUrl(): void {
  const prodEnvPath = path.resolve(process.cwd(), '.vercel/.env.production.local')
  if (!fs.existsSync(prodEnvPath)) {
    throw new Error('Missing .vercel/.env.production.local for --production')
  }

  const match = fs
    .readFileSync(prodEnvPath, 'utf8')
    .split('\n')
    .find((line) => line.startsWith('DATABASE_URL='))

  if (!match) {
    throw new Error('DATABASE_URL not found in .vercel/.env.production.local')
  }

  process.env.DATABASE_URL = match.slice('DATABASE_URL='.length).replace(/^"|"$/g, '')
}

function createPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured')
  }

  return new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
  })
}

function readSentLog(): SentLog {
  if (!fs.existsSync(SENT_LOG_PATH)) {
    const empty: SentLog = {
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sent: [],
      failed: [],
    }
    return empty
  }

  return JSON.parse(fs.readFileSync(SENT_LOG_PATH, 'utf8')) as SentLog
}

function writeSentLog(log: SentLog): void {
  fs.mkdirSync(path.dirname(SENT_LOG_PATH), { recursive: true })
  log.updatedAt = new Date().toISOString()
  fs.writeFileSync(SENT_LOG_PATH, JSON.stringify(log, null, 2))
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function sendOne(to: string, firstName: string, template: string) {
  const text = renderBody(template, firstName)
  return sendMail({
    fromEmail: FROM_EMAIL,
    to,
    subject: SUBJECT,
    text,
  })
}

async function main() {
  const testTo = parseArg('--test-to')
  const limit = parseArg('--limit') ? Number(parseArg('--limit')) : undefined
  const delayMs = parseArg('--delay-ms') ? Number(parseArg('--delay-ms')) : 3000
  const dryRun = hasFlag('--dry-run')
  const resume = hasFlag('--resume')

  if (hasFlag('--production')) {
    loadProductionDatabaseUrl()
  }

  const template = loadBodyTemplate()

  if (testTo) {
    console.log(`📧 Test send to ${testTo} from ${FROM_EMAIL}`)
    const info = await sendOne(testTo, 'Frank', template)
    console.log(`✅ Test email sent. Message ID: ${info.messageId}`)
    return
  }

  const prisma = createPrisma()

  try {
    const users = await prisma.user.findMany({
      where: {
        email: { not: null },
        createdAt: { lte: CAMPAIGN_AUDIENCE_CUTOFF },
      },
      select: { id: true, email: true, name: true },
      orderBy: { createdAt: 'asc' },
    })

    const recipients = users.filter(
      (user): user is { id: string; email: string; name: string | null } =>
        typeof user.email === 'string' && user.email.length > 0
    )

    const log = resume
      ? readSentLog()
      : {
          startedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sent: [],
          failed: [],
        }

    const sentEmails = new Set(log.sent.map((entry) => entry.email.toLowerCase()))
    let pending = recipients.filter((user) => !sentEmails.has(user.email.toLowerCase()))

    if (limit && limit > 0) {
      pending = pending.slice(0, limit)
    }

    console.log('📊 Face Analysis launch email')
    console.log(`   From: ${FROM_EMAIL}`)
    console.log(`   Audience cutoff: ${CAMPAIGN_AUDIENCE_CUTOFF.toISOString()}`)
    console.log(`   Users with email in audience: ${recipients.length}`)
    console.log(`   Pending this run: ${pending.length}`)
    console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
    console.log('')

    if (pending.length === 0) {
      console.log('✅ Nothing to send.')
      return
    }

    console.log('Sample recipients:')
    pending.slice(0, 5).forEach((user) => {
      console.log(`   - ${user.email} (${extractFirstName(user.name, user.email)})`)
    })
    console.log('')

    if (dryRun) {
      console.log('🔸 DRY RUN complete. Re-run without --dry-run to send.')
      return
    }

    let sentCount = 0
    let failedCount = 0

    for (const user of pending) {
      const firstName = extractFirstName(user.name, user.email)
      process.stdout.write(`📤 ${user.email} ... `)

      let delivered = false
      let lastError = ''

      for (let attempt = 1; attempt <= 12; attempt += 1) {
        try {
          const info = await sendOne(user.email, firstName, template)
          log.sent.push({
            userId: user.id,
            email: user.email,
            messageId: info.messageId,
            sentAt: new Date().toISOString(),
          })
          writeSentLog(log)
          sentCount += 1
          delivered = true
          console.log(`✅ ${info.messageId}`)
          break
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          lastError = message

          if (message.includes('too frequently') && attempt < 12) {
            const waitMinutes = Math.min(60, 15 * attempt)
            console.log('')
            console.log(
              `⏸ Rate limited on ${user.email}. Waiting ${waitMinutes} min (attempt ${attempt}/12)...`
            )
            await sleep(waitMinutes * 60 * 1000)
            process.stdout.write(`📤 ${user.email} (retry) ... `)
            continue
          }

          log.failed.push({
            userId: user.id,
            email: user.email,
            error: message,
            failedAt: new Date().toISOString(),
          })
          writeSentLog(log)
          failedCount += 1
          console.log(`❌ ${message}`)
          break
        }
      }

      if (delayMs > 0 && delivered) {
        await sleep(delayMs)
      }
    }

    console.log('')
    console.log(`Done. Sent: ${sentCount}, Failed: ${failedCount}`)
    console.log(`Log: ${SENT_LOG_PATH}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('❌ Failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
