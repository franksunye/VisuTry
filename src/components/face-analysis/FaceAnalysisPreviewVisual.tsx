import Image from 'next/image'
import { ArrowRight, CheckCircle2, Glasses, ScanFace, Sparkles } from 'lucide-react'

type FaceAnalysisPreviewVisualProps = {
  variant?: 'workflow' | 'report'
}

const recommendedStyles = [
  {
    name: 'Rectangle',
    reason: 'Adds clean structure',
    image: '/assets/glasses-presets/rectangle-classic.jpg',
  },
  {
    name: 'Browline',
    reason: 'Balances the upper face',
    image: '/assets/glasses-presets/browline-classic.jpg',
  },
  {
    name: 'Aviator',
    reason: 'Softens the outline',
    image: '/assets/glasses-presets/aviator-classic.jpg',
  },
]

export function FaceAnalysisPreviewVisual({
  variant = 'report',
}: FaceAnalysisPreviewVisualProps) {
  if (variant === 'workflow') {
    return <FaceAnalysisWorkflowPreview />
  }

  return <FaceAnalysisReportPreview />
}

function FaceAnalysisWorkflowPreview() {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl shadow-blue-950/5">
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <ScanFace className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-950">AI Face Analysis</p>
              <p className="text-xs text-gray-500">Glasses recommendation flow</p>
            </div>
          </div>
          <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
            Ready
          </span>
        </div>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-[0.86fr_1.14fr]">
        <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/60 p-3">
          <div className="relative mx-auto aspect-[4/5] max-w-[180px] overflow-hidden rounded-lg bg-white">
            <Image
              src="/assets/face-analysis/neutral-face-wireframe.png"
              alt="Face analysis preview"
              fill
              className="object-cover"
              sizes="220px"
            />
          </div>
          <div className="mt-3 grid gap-2 text-xs text-gray-600">
            {['Photo uploaded', 'Face shape detected', 'Frame styles shortlisted'].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-normal text-blue-600">
              Result
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-2xl font-bold text-gray-950">Oval Face</p>
                <p className="mt-1 text-sm text-gray-600">Balanced proportions, flexible frame choices.</p>
              </div>
              <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                92%
              </span>
            </div>
          </div>

          <div className="grid gap-3">
            {recommendedStyles.map((style) => (
              <div key={style.name} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                <div className="relative h-14 w-20 overflow-hidden rounded-lg bg-gray-100">
                  <Image
                    src={style.image}
                    alt={`${style.name} glasses`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-950">{style.name}</p>
                  <p className="text-xs text-gray-600">{style.reason}</p>
                </div>
                <span className="text-xs font-semibold text-blue-700">Try</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function FaceAnalysisReportPreview() {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl shadow-blue-950/10">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-950">AI Face Shape Report</p>
            <p className="text-xs text-gray-500">Sample layout</p>
          </div>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
          Glasses fit
        </span>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-[0.72fr_1.28fr]">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="relative mx-auto aspect-[4/5] max-w-[190px] overflow-hidden rounded-lg bg-white">
            <Image
              src="/assets/face-analysis/neutral-face-wireframe.png"
              alt="AI face shape wireframe preview"
              fill
              className="object-cover"
              sizes="260px"
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-white px-2 py-2">
              <p className="text-[11px] text-gray-500">Shape</p>
              <p className="text-xs font-semibold text-gray-950">Oval</p>
            </div>
            <div className="rounded-lg bg-white px-2 py-2">
              <p className="text-[11px] text-gray-500">Match</p>
              <p className="text-xs font-semibold text-green-700">92%</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-blue-600">
                  Your face shape
                </p>
                <p className="mt-1 text-3xl font-bold text-gray-950">Oval</p>
              </div>
              <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                92% match
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Balanced width, soft jawline, flexible fit. Start with clean frames, then validate
              scale with try-on.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-100 pt-4">
              {[
                ['Jawline', 'Soft'],
                ['Cheekbones', 'Medium-high'],
                ['Frame width', 'Medium'],
                ['Best first step', 'Try styles'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm font-semibold text-gray-950">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Glasses className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-semibold text-gray-950">Styles to try</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                Try-on
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {recommendedStyles.map((style) => (
                <div key={style.name} className="rounded-lg border border-gray-200 p-2">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-gray-100">
                    <Image
                      src={style.image}
                      alt={`${style.name} glasses`}
                      fill
                      className="object-cover"
                      sizes="120px"
                    />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-gray-950">{style.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
