"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle2, Gift, ScanFace, Sparkles, X } from "lucide-react"
import { cn } from "@/utils/cn"

type FaceAnalysisNudgeVariant = "pre" | "post"

interface FaceAnalysisNudgeProps {
  href: string
  variant: FaceAnalysisNudgeVariant
  onCtaClick?: () => void
  onDismiss?: () => void
  className?: string
}

const contentByVariant = {
  pre: {
    eyebrow: "Face Analysis First",
    title: "Not sure what suits you?",
    description:
      "Start with Face Analysis to get personalized frame recommendations before trying glasses on.",
    cta: "Analyze my face",
    supporting: "Takes about 30 seconds",
    points: ["Detect face shape", "Find flattering frames", "Save time in try-on"],
  },
  post: {
    eyebrow: "Better recommendations",
    title: "Want more precise frame ideas?",
    description:
      "Analyze your face shape, proportions, and best frame styles before choosing your next pair.",
    cta: "Get Face Analysis",
    supporting: "Helpful after seeing your first result",
    points: ["Face shape & proportions", "Best frame style matches", "Personalized suggestions"],
  },
} satisfies Record<FaceAnalysisNudgeVariant, {
  eyebrow: string
  title: string
  description: string
  cta: string
  supporting: string
  points: string[]
}>

export function FaceAnalysisNudge({
  href,
  variant,
  onCtaClick,
  onDismiss,
  className,
}: FaceAnalysisNudgeProps) {
  const content = contentByVariant[variant]
  const isPost = variant === "post"

  return (
    <aside
      className={cn(
        "rounded-lg border border-blue-200 bg-gradient-to-br from-white via-blue-50/70 to-white shadow-sm",
        isPost ? "p-5" : "p-4 md:p-5",
        className,
      )}
      aria-label="Face Analysis recommendation"
    >
      <div className={cn("flex gap-4", isPost ? "flex-col sm:flex-row sm:items-start" : "items-start")}>
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          {isPost ? <Sparkles className="h-5 w-5" /> : <ScanFace className="h-5 w-5" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-normal text-blue-700">
                {content.eyebrow}
              </p>
              <h2 className={cn("mt-1 font-bold leading-snug text-gray-950", isPost ? "text-xl" : "text-base")}>
                {content.title}
              </h2>
            </div>
            {onDismiss ? (
              <button
                type="button"
                onClick={onDismiss}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-white hover:text-gray-700"
                aria-label="Dismiss Face Analysis recommendation"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <p className={cn("mt-2 text-gray-600", isPost ? "text-sm leading-6" : "text-sm leading-6")}>
            {content.description}
          </p>

          <div className={cn("mt-4 grid gap-2", isPost ? "sm:grid-cols-3" : "sm:grid-cols-3")}>
            {content.points.map((point) => (
              <div key={point} className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
                <span>{point}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={href}
              onClick={onCtaClick}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              {content.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500">
              <Gift className="h-4 w-4 text-blue-500" />
              {content.supporting}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
