import dotenv from "dotenv"
import type { RefundResult } from "@/lib/payment-refund"

dotenv.config()
dotenv.config({ path: ".env.local", override: true })

type Args = {
  paymentId?: string
  execute: boolean
  confirmation?: string
  allowLive: boolean
  json: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = { execute: false, allowLive: false, json: false }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === "--payment-id") args.paymentId = argv[++index]
    else if (arg === "--execute") args.execute = true
    else if (arg === "--confirm") args.confirmation = argv[++index]
    else if (arg === "--allow-live") args.allowLive = true
    else if (arg === "--json") args.json = true
    else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: npm run refund:payment -- --payment-id <id> [--execute --confirm <id>] [--allow-live] [--json]

Default mode is a read-only dry run. Live Stripe keys require --allow-live.`)
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  if (!args.paymentId) throw new Error("--payment-id is required")
  return args
}

function serialize(result: RefundResult) {
  return {
    mode: result.mode,
    status: result.status,
    paymentId: result.paymentId,
    stripeRefundId: result.stripeRefundId ?? null,
    creditsRevoked: result.creditsRevoked,
    preflight: {
      canExecute: result.preflight.canExecute,
      reasons: result.preflight.reasons,
      creditPaymentCount: result.preflight.creditPaymentCount,
      creditsToRevoke: result.preflight.creditsToRevoke,
      payment: {
        id: result.preflight.payment.id,
        userId: result.preflight.payment.userId,
        email: result.preflight.payment.user.email,
        stripePaymentId: result.preflight.payment.stripePaymentId,
        amount: result.preflight.payment.amount,
        currency: result.preflight.payment.currency,
        status: result.preflight.payment.status,
        productType: result.preflight.payment.productType,
        createdAt: result.preflight.payment.createdAt,
        refundId: result.preflight.payment.refundId,
        creditsPurchased: result.preflight.payment.user.creditsPurchased,
        creditsUsed: result.preflight.payment.user.creditsUsed,
      },
    },
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const [{ prisma }, { stripe }, { clearUserCache }, refundModule] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/stripe"),
    import("@/lib/cache"),
    import("@/lib/payment-refund"),
  ])
  prismaClient = prisma
  const secretKey = process.env.STRIPE_SECRET_KEY ?? ""
  const isLive = secretKey.startsWith("sk_live_")
  if (isLive && !args.allowLive) {
    throw new Error("Live Stripe key detected. Re-run with --allow-live only after explicit approval.")
  }

  const result = await refundModule.refundPayment(
    { prisma: prisma as any, stripe, clearUserCache },
    {
      paymentId: args.paymentId!,
      mode: args.execute ? "execute" : "dry-run",
      confirmation: args.confirmation,
    },
  )
  const output = serialize(result)
  if (args.json) console.log(JSON.stringify(output, null, 2))
  else {
    console.log(`Stripe mode: ${isLive ? "LIVE" : "TEST"}`)
    console.log(JSON.stringify(output, null, 2))
  }
}

let prismaClient: { $disconnect: () => Promise<void> } | undefined

main()
  .catch((error) => {
    if (error instanceof Error && error.name === "RefundPreflightError" && "preflight" in error) {
      const preflight = (error as Error & { preflight: { reasons: string[] } }).preflight
      console.error(error.message)
      console.error(JSON.stringify({ canExecute: false, reasons: preflight.reasons }, null, 2))
    } else {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes("does not exist in the current database")) {
        console.error("Refund tracking migration is not applied. Run `npx prisma migrate deploy` in the intended environment before using this tool.")
      } else {
        console.error(message)
      }
    }
    process.exitCode = 1
  })
  .finally(async () => {
    if (prismaClient) await prismaClient.$disconnect()
  })
