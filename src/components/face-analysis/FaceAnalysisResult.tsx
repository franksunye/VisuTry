'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Gem,
  Glasses,
  Lock,
  Ruler,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { FACE_ANALYSIS_LAYOUT, getFaceShapeIcon } from '@/config/face-analysis'
import {
  FaceAnalysisMetric,
  FaceAnalysisTaskResponse,
  FrameRecommendation,
  StyleTip,
} from '@/types/face-analysis'
import { FaceWireframeOverlay } from './FaceWireframeOverlay'
import { UnlockCreditsBanner } from './UnlockCreditsBanner'
import { FrameSearchSuggestions } from './FrameSearchSuggestions'
import { cn } from '@/utils/cn'

interface FaceAnalysisResultProps {
  task: FaceAnalysisTaskResponse
  onUnlock: () => void
  isUnlocking?: boolean
}

const metricIconMap: Record<FaceAnalysisMetric['id'], typeof Target> = {
  faceShape: Target,
  faceLength: Ruler,
  faceWidth: Ruler,
  jawline: ShieldCheck,
  cheekbones: Gem,
  symmetry: Sparkles,
}

export function FaceAnalysisResult({ task, onUnlock, isUnlocking }: FaceAnalysisResultProps) {
  const params = useParams()
  const locale = (params.locale as string) || 'en'
  const t = useTranslations('faceAnalysis.result')
  const basic = task.basicResult
  const full = task.fullResult
  const teaser = task.lockedTeaser
  const confidencePercent = basic ? Math.round((basic.confidence ?? 0) * 100) : null
  const ShapeIcon = basic ? getFaceShapeIcon(basic.faceShape) : getFaceShapeIcon('oval')

  const previewBestFrames = teaser?.bestFrames ?? full?.bestFrames ?? []
  const previewFramesToAvoid = teaser?.framesToAvoid ?? full?.framesToAvoid ?? []
  const searchStyles =
    full?.catalogRecommendedStyles ??
    teaser?.catalogRecommendedStyles

  const isUnlocked = task.reportUnlocked && !!full
  const metrics = full?.metrics ?? []
  const recommended = full?.frameRecommendations ?? []
  const avoid = full?.avoidRecommendations ?? []
  const styleTips = full?.styleTips ?? []
  const tryOnStyles = full?.tryOnGuidance?.topStyles ?? recommended.slice(0, 4).map((item) => item.displayName)

  const handleDownload = () => {
    window.print()
  }

  if (!basic) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900">Your AI Face Shape Report</h2>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              AI-powered
            </span>
            {task.status === 'completed' && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                {t('completed')}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Style guidance for frame selection and AI try-on. Not medical or biometric advice.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          disabled={!isUnlocked}
          className="inline-flex items-center justify-center rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
        >
          <Download className="mr-2 h-4 w-4" />
          {isUnlocked ? 'Download Report' : 'Unlock to Download'}
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_1fr_1fr]">
        <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'overflow-hidden p-4')}>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[320px] overflow-hidden rounded-xl bg-gray-100">
            <Image
              src={task.userImageUrl}
              alt={t('yourPhoto')}
              fill
              className="object-cover"
              sizes="320px"
            />
            <FaceWireframeOverlay className="absolute inset-0 h-full w-full pointer-events-none" />
          </div>
          <p className="mt-3 text-center text-xs text-gray-500">{t('wireframeCaption')}</p>
        </div>

        <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-5')}>
          <p className="mb-4 text-sm font-semibold text-gray-900">Your Face Shape</p>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <ShapeIcon className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-3xl font-bold capitalize text-gray-950">
                {basic.faceShapeDisplayName?.replace(' Face', '') || basic.faceShape}
              </h3>
              {confidencePercent !== null && (
                <span className="mt-2 inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                  {confidencePercent}% confidence
                </span>
              )}
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-gray-600">
            {full?.overview?.summary || basic.summary}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5">
            {(metrics.length > 0 ? metrics.slice(1, 5) : fallbackMetricSummary(basic.keyFeatures)).map((metric) => (
              <div key={metric.label}>
                <p className="text-xs text-gray-500">{metric.label}</p>
                <p className="text-sm font-semibold text-gray-900">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-5')}>
          <p className="mb-4 text-sm font-semibold text-gray-900">{t('keyFeatures')}</p>
          <ul className="space-y-4">
            {(full?.overview?.strengths ?? basic.keyFeatures).slice(0, 5).map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-gray-700">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {isUnlocked ? (
        <>
          {metrics.length > 0 && <MetricsSection metrics={metrics} />}

          <div className="grid gap-5 xl:grid-cols-2">
            <FrameRecommendationPanel
              title="Frames to Wear"
              subtitle="Best frame shapes that complement your face shape."
              badge="Top picks"
              badgeClassName="bg-green-50 text-green-700"
              recommendations={recommended}
            />
            <FrameRecommendationPanel
              title="Frames to Avoid"
              subtitle="Frame shapes that may not flatter your proportions."
              badge="Avoid"
              badgeClassName="bg-red-50 text-red-700"
              recommendations={avoid}
              isAvoid
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <StyleGuidePanel tips={styleTips} userImageUrl={task.userImageUrl} />
            <TryOnTopPicksPanel
              styles={tryOnStyles}
              userImageUrl={task.userImageUrl}
              locale={locale}
              note={full?.tryOnGuidance?.note}
              cta={full?.tryOnGuidance?.cta}
            />
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <AlertTriangle className="mr-2 inline h-4 w-4 align-text-bottom" />
            {full?.overview?.disclaimer ||
              'AI-estimated style guidance based on the uploaded photo. Results are not medical or biometric measurements.'}
          </div>
        </>
      ) : (
        <LockedPremiumPreview
          bestFrames={previewBestFrames}
          framesToAvoid={previewFramesToAvoid}
          onUnlock={onUnlock}
          isUnlocking={isUnlocking}
          faceShape={basic.faceShape}
        />
      )}

      <FrameSearchSuggestions
        faceShape={basic.faceShape}
        catalogStyles={searchStyles}
      />
    </div>
  )
}

function MetricsSection({ metrics }: { metrics: FaceAnalysisMetric[] }) {
  return (
    <section className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-5')}>
      <div className="mb-5">
        <h3 className="text-base font-semibold text-gray-950">Face Analysis Details</h3>
        <p className="mt-1 text-sm text-gray-500">AI analysis of facial structure and frame-fit signals.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metricIconMap[metric.id]
          return (
            <div key={metric.id} className="rounded-xl border border-gray-200 p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">{metric.label}</p>
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <MetricVisual metric={metric} />
              <p className="mt-4 text-center text-sm font-semibold text-blue-700">{metric.value}</p>
              <p className="text-center text-xs font-medium text-gray-900">{metric.caption}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${metric.score}%` }}
                />
              </div>
              <p className="mt-3 text-xs leading-5 text-gray-500">{metric.detail}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function FrameRecommendationPanel({
  title,
  subtitle,
  badge,
  badgeClassName,
  recommendations,
  isAvoid = false,
}: {
  title: string
  subtitle: string
  badge: string
  badgeClassName: string
  recommendations: FrameRecommendation[]
  isAvoid?: boolean
}) {
  return (
    <section className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-5')}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-950">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
        <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', badgeClassName)}>
          {badge}
        </span>
      </div>
      <div className={cn('grid gap-3', isAvoid ? 'sm:grid-cols-1' : 'sm:grid-cols-2')}>
        {recommendations.slice(0, isAvoid ? 3 : 4).map((item) => (
          <div
            key={item.type}
            className={cn(
              'rounded-xl border p-4',
              isAvoid ? 'border-red-100 bg-red-50/40' : 'border-green-100 bg-green-50/30'
            )}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <FrameIcon type={item.type} className={isAvoid ? 'text-red-600' : 'text-gray-950'} />
              <span className={cn(
                'rounded-full px-2 py-0.5 text-xs font-semibold',
                isAvoid ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              )}>
                {item.score}% match
              </span>
            </div>
            <p className="font-semibold text-gray-950">{item.displayName}</p>
            <p className="mt-1 text-xs leading-5 text-gray-600">{item.reason}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function StyleGuidePanel({ tips, userImageUrl }: { tips: StyleTip[]; userImageUrl: string }) {
  return (
    <section className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-5')}>
      <h3 className="text-base font-semibold text-gray-950">Personal Style Guide</h3>
      <p className="mt-1 text-sm text-gray-500">Practical styling advice for your frame search.</p>
      <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_180px]">
        <div className="space-y-4">
          {tips.map((tip) => (
            <div key={tip.title} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{tip.title}</p>
                <p className="text-sm leading-6 text-gray-600">{tip.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="relative hidden aspect-[4/5] overflow-hidden rounded-xl bg-gray-100 sm:block">
          <Image src={userImageUrl} alt="Style guide preview" fill className="object-cover" sizes="180px" />
          <div className="absolute inset-x-6 top-[34%]">
            <FrameIcon type="browline" className="h-12 w-full text-gray-950" />
          </div>
        </div>
      </div>
    </section>
  )
}

function TryOnTopPicksPanel({
  styles,
  userImageUrl,
  locale,
  note,
  cta,
}: {
  styles: string[]
  userImageUrl: string
  locale: string
  note?: string
  cta?: string
}) {
  return (
    <section className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-5')}>
      <h3 className="text-base font-semibold text-gray-950">Try On Your Top Picks</h3>
      <p className="mt-1 text-sm text-gray-500">{note || 'See how recommended frame styles look on you.'}</p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {styles.slice(0, 4).map((style) => (
          <div key={style} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="relative aspect-square bg-gray-100">
              <Image src={userImageUrl} alt={`${style} try-on preview`} fill className="object-cover" sizes="120px" />
              <div className="absolute inset-x-4 top-[34%]">
                <FrameIcon type={style} className="h-9 w-full text-gray-950 drop-shadow-sm" />
              </div>
            </div>
            <p className="truncate px-2 py-2 text-center text-xs font-semibold text-gray-900">{style}</p>
          </div>
        ))}
      </div>
      <Link
        href={`/${locale}/try-on/glasses`}
        className="mt-5 inline-flex w-full items-center justify-center rounded-lg border border-blue-200 px-4 py-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
      >
        <Glasses className="mr-2 h-4 w-4" />
        {cta || 'Try them on now'}
      </Link>
    </section>
  )
}

function LockedPremiumPreview({
  bestFrames,
  framesToAvoid,
  onUnlock,
  isUnlocking,
  faceShape,
}: {
  bestFrames: string[]
  framesToAvoid: string[]
  onUnlock: () => void
  isUnlocking?: boolean
  faceShape?: string
}) {
  return (
    <div className="space-y-5">
      <section className={cn(FACE_ANALYSIS_LAYOUT.card, 'relative overflow-hidden p-5')}>
        <div className="grid gap-5 md:grid-cols-3">
          <PremiumPreviewCard title="Face metrics" lines={['Face length', 'Face width', 'Jawline', 'Symmetry']} />
          <PremiumPreviewCard title="Best frames" lines={bestFrames.length ? bestFrames : ['Round frames', 'Aviator frames']} />
          <PremiumPreviewCard title="Style guide" lines={['Personalized frame notes', 'Fit and sizing tips', 'Try-on guidance']} />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 p-6 text-center backdrop-blur-[2px]">
          <Lock className="mb-3 h-9 w-9 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-950">Unlock your complete report</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-gray-600">
            See detailed metrics, frame scores, styles to avoid, and a personal style guide built for your face shape.
          </p>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-5')}>
          <p className="mb-3 text-sm font-semibold text-gray-900">Preview: best frame directions</p>
          <p className="text-sm leading-6 text-gray-600">{bestFrames.join(' · ')}</p>
        </div>
        <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-5')}>
          <p className="mb-3 text-sm font-semibold text-gray-900">Preview: styles to avoid</p>
          <p className="text-sm leading-6 text-gray-600">{framesToAvoid.join(' · ')}</p>
        </div>
      </div>

      <UnlockCreditsBanner onUnlock={onUnlock} isLoading={isUnlocking} faceShape={faceShape} />
    </div>
  )
}

function PremiumPreviewCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 blur-sm">
      <p className="mb-3 text-sm font-semibold text-gray-950">{title}</p>
      <div className="space-y-2">
        {lines.map((line) => (
          <div key={line} className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            {line}
          </div>
        ))}
      </div>
    </div>
  )
}

function MetricVisual({ metric }: { metric: FaceAnalysisMetric }) {
  return (
    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-blue-100 bg-blue-50">
      <svg viewBox="0 0 100 100" className="h-20 w-20 text-blue-600" fill="none" aria-hidden>
        <ellipse cx="50" cy="50" rx="28" ry="36" stroke="currentColor" strokeWidth="3" />
        {metric.id === 'faceWidth' && <line x1="20" y1="50" x2="80" y2="50" stroke="currentColor" strokeDasharray="4 4" strokeWidth="3" />}
        {metric.id === 'faceLength' && <line x1="50" y1="14" x2="50" y2="86" stroke="currentColor" strokeDasharray="4 4" strokeWidth="3" />}
        {metric.id === 'jawline' && <path d="M30 58 Q50 88 70 58" stroke="currentColor" strokeWidth="4" />}
        {metric.id === 'cheekbones' && (
          <>
            <circle cx="30" cy="52" r="8" fill="currentColor" opacity="0.35" />
            <circle cx="70" cy="52" r="8" fill="currentColor" opacity="0.35" />
          </>
        )}
        {metric.id === 'symmetry' && <line x1="50" y1="12" x2="50" y2="88" stroke="currentColor" strokeWidth="3" />}
        {metric.id === 'faceShape' && <polygon points="50,16 76,38 68,76 32,76 24,38" stroke="currentColor" strokeWidth="3" />}
      </svg>
    </div>
  )
}

function FrameIcon({ type, className }: { type: string; className?: string }) {
  const normalized = type.toLowerCase()
  const isRound = normalized.includes('round') || normalized.includes('oval')
  const isAviator = normalized.includes('aviator')
  const isCat = normalized.includes('cat')
  const isBrowline = normalized.includes('brow') || normalized.includes('wayfarer')

  return (
    <svg viewBox="0 0 120 48" className={cn('h-10 w-20', className)} fill="none" aria-hidden>
      <path d="M55 24 C58 21 62 21 65 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      {isAviator ? (
        <>
          <path d="M12 15 C28 8 48 13 50 24 C52 36 39 43 27 39 C16 35 8 20 12 15Z" stroke="currentColor" strokeWidth="3" />
          <path d="M108 15 C92 8 72 13 70 24 C68 36 81 43 93 39 C104 35 112 20 108 15Z" stroke="currentColor" strokeWidth="3" />
        </>
      ) : isRound ? (
        <>
          <circle cx="34" cy="25" r="18" stroke="currentColor" strokeWidth="3" />
          <circle cx="86" cy="25" r="18" stroke="currentColor" strokeWidth="3" />
        </>
      ) : isCat ? (
        <>
          <path d="M12 18 L50 12 L46 36 L18 36 Z" stroke="currentColor" strokeWidth="3" />
          <path d="M108 18 L70 12 L74 36 L102 36 Z" stroke="currentColor" strokeWidth="3" />
        </>
      ) : (
        <>
          <rect x="12" y="14" width="40" height="24" rx={isBrowline ? 8 : 4} stroke="currentColor" strokeWidth="3" />
          <rect x="68" y="14" width="40" height="24" rx={isBrowline ? 8 : 4} stroke="currentColor" strokeWidth="3" />
          {isBrowline && (
            <>
              <path d="M14 14 H50" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
              <path d="M70 14 H106" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            </>
          )}
        </>
      )}
      <path d="M12 20 L2 15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M108 20 L118 15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function fallbackMetricSummary(features: string[]) {
  return features.slice(0, 4).map((feature, index) => ({
    label: ['Structure', 'Balance', 'Frame Fit', 'Style'][index] ?? 'Feature',
    value: feature,
  }))
}
