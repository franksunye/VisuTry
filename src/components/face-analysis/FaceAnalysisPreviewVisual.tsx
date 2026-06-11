import Image from 'next/image'
import { CheckCircle2, Glasses, ScanFace, Sparkles } from 'lucide-react'

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
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
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

      <div className="grid gap-4 p-4 md:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/60 p-4">
          <div className="relative mx-auto aspect-[4/5] max-w-[210px] overflow-hidden rounded-lg bg-white">
            <Image
              src="/assets/face-analysis/neutral-face-wireframe.png"
              alt="Face analysis preview"
              fill
              className="object-cover"
              sizes="220px"
            />
          </div>
          <div className="mt-4 grid gap-2 text-xs text-gray-600">
            {['Photo uploaded', 'Face shape detected', 'Frame styles shortlisted'].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 p-4">
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
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-950">AI Face Shape Report</p>
            <p className="text-xs text-gray-500">Preview based on a sample report layout</p>
          </div>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
          Glasses fit
        </span>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-lg border border-gray-200 p-3">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-gray-100">
            <Image
              src="/assets/face-analysis/neutral-face-wireframe.png"
              alt="AI face shape wireframe preview"
              fill
              className="object-cover"
              sizes="260px"
            />
          </div>
          <p className="mt-3 text-center text-xs text-gray-500">Face outline and proportions</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-normal text-blue-600">
              Your face shape
            </p>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-3xl font-bold text-gray-950">Oval</p>
                <p className="mt-1 text-sm text-gray-600">Balanced width, soft jawline, flexible fit.</p>
              </div>
              <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                92% match
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
              {[
                ['Face length', 'Balanced'],
                ['Jawline', 'Soft'],
                ['Cheekbones', 'Medium-high'],
                ['Frame width', 'Medium'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm font-semibold text-gray-950">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Glasses className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-semibold text-gray-950">Top frame styles to try</p>
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
