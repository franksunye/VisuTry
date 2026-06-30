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
    eyebrow: "Glasses Advisor",
    title: "Not sure what suits you?",
    description:
      "Use Glasses Advisor to get personalized frame recommendations before trying glasses on.",
    cta: "Open Glasses Advisor",
    supporting: "Takes about 30 seconds",
    points: ["Detect face shape", "Find flattering frames", "Save time in try-on"],
  },
  post: {
    eyebrow: "Better recommendations",
    title: "Want more precise frame ideas?",
    description:
      "Analyze your face shape, proportions, and best frame styles before choosing your next pair.",
    cta: "Open Glasses Advisor",
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

  if (!isPost) {
    return (
      <aside
        className={cn(
          "rounded-lg border border-blue-100 bg-white/80 px-4 py-3 shadow-sm",
          className,
        )}
        aria-label="Glasses Advisor recommendation"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ScanFace className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-950">{content.title}</h2>
              <p className="mt-1 text-sm leading-5 text-gray-600">
                Get face-shape guidance before choosing frames.
              </p>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2 pl-12 sm:pl-0">
            <Link
              href={href}
              onClick={onCtaClick}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
            >
              {content.cta}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            {onDismiss ? (
              <button
                type="button"
                onClick={onDismiss}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="Dismiss Glasses Advisor recommendation"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside
      className={cn(
        "rounded-lg border border-blue-200 bg-gradient-to-br from-white via-blue-50/70 to-white shadow-sm",
        isPost ? "p-5" : "p-4 md:p-5",
        className,
      )}
      aria-label="Glasses Advisor recommendation"
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
                aria-label="Dismiss Glasses Advisor recommendation"
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
