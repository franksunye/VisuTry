import Image from 'next/image'
import { ArrowRight, CheckCircle2, Download, Glasses, ScanFace, Sparkles } from 'lucide-react'

type FaceAnalysisPreviewVisualProps = {
  variant?: 'workflow' | 'report'
}

const recommendedStyles = [
  {
    name: 'Round',
    reason: 'Softens angles',
    image: '/assets/glasses-presets/round-classic.jpg',
  },
  {
    name: 'Aviator',
    reason: 'Adds balance',
    image: '/assets/glasses-presets/aviator-classic.jpg',
  },
  {
    name: 'Browline',
    reason: 'Defines the top line',
    image: '/assets/glasses-presets/browline-classic.jpg',
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
    <div className="w-full max-w-full overflow-hidden rounded-lg border border-blue-100 bg-white shadow-2xl shadow-blue-950/10">
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <ScanFace className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-950">Face-to-fit workflow</p>
              <p className="text-xs text-gray-500">Photo, report, try-on shortlist</p>
            </div>
          </div>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            AI guided
          </span>
        </div>
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-[0.9fr_1.1fr_0.86fr]">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="relative mx-auto aspect-[4/5] overflow-hidden rounded-lg bg-white">
            <Image
              src="/assets/face-analysis/model-face-square-report.jpg"
              alt="Front-facing portrait prepared for AI face analysis"
              fill
              className="object-cover"
              sizes="220px"
            />
            <div className="absolute inset-x-6 top-[28%] border-t border-dashed border-blue-500/70" />
            <div className="absolute bottom-[23%] left-[29%] right-[29%] border-t border-dashed border-blue-500/70" />
            <span className="absolute left-[19%] top-[27%] h-2 w-2 rounded-full bg-blue-600" />
            <span className="absolute right-[19%] top-[27%] h-2 w-2 rounded-full bg-blue-600" />
          </div>
          <div className="mt-3 flex items-center justify-between rounded-lg bg-white px-3 py-2">
            <span className="text-xs font-semibold text-gray-600">Photo</span>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-normal text-blue-600">AI Analysis</p>
            <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
              92% confidence
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-950">Square face</p>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Strong jawline, balanced facial width, and angular structure.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {[
              ['Face width', 'Wide'],
              ['Jawline', 'Strong'],
              ['Symmetry', 'High'],
              ['Best fit', 'Curved'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm font-semibold text-gray-950">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3">
          <div className="mb-3 flex items-center gap-2">
            <Glasses className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-semibold text-gray-950">Try next</p>
          </div>
          <div className="grid gap-3">
            {recommendedStyles.slice(0, 2).map((style) => (
              <div key={style.name} className="rounded-lg bg-white p-2 shadow-sm">
                <div className="relative aspect-[5/3] overflow-hidden rounded-md bg-gray-100">
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
          <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
            Open try-on
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </div>
    </div>
  )
}

function FaceAnalysisReportPreview() {
  return (
    <div className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-2xl shadow-blue-950/10">
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3 text-xs font-semibold text-gray-400">
          <span>Photo</span>
          <ArrowRight className="h-3 w-3" />
          <span className="text-blue-700">AI Analysis</span>
          <ArrowRight className="h-3 w-3" />
          <span>Glasses</span>
        </div>
        <span className="hidden rounded-lg border border-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 sm:inline-flex">
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Report
        </span>
      </div>

      <div className="grid min-w-0 gap-3 bg-gradient-to-br from-white via-blue-50/40 to-white p-3 2xl:grid-cols-[0.54fr_1.46fr]">
        <aside className="hidden rounded-lg border border-gray-200 bg-white p-3 2xl:block">
          <div className="mb-3 rounded-lg bg-green-50 px-3 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-xs font-semibold text-gray-950">Analysis completed</p>
            </div>
          </div>
          {['Overview', 'Face analysis', 'Recommendations'].map((item, index) => (
            <div
              key={item}
              className={`mb-1 rounded-lg px-3 py-2 text-xs font-semibold ${
                index === 0 ? 'bg-blue-50 text-blue-700' : 'text-gray-500'
              }`}
            >
              {item}
            </div>
          ))}
          <div className="mt-5">
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-gray-100">
              <Image
                src="/assets/face-analysis/model-face-square-report.jpg"
                alt="Uploaded portrait thumbnail"
                fill
                className="object-cover"
                sizes="180px"
              />
            </div>
            <p className="mt-2 text-center text-[11px] leading-5 text-gray-500">
              Clear front-facing photo
            </p>
          </div>
        </aside>

        <div className="min-w-0 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-normal text-blue-600">AI-powered</p>
              <h3 className="text-xl font-bold text-gray-950 md:text-2xl">Your AI Face Shape Report</h3>
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              Glasses fit
            </span>
          </div>

          <div className="grid min-w-0 gap-3 md:grid-cols-[0.82fr_1.18fr]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-gray-100">
              <Image
                src="/assets/face-analysis/model-face-square-report.jpg"
                alt="AI face analysis portrait with measurement guides"
                fill
                className="object-cover"
                sizes="260px"
              />
              <div className="absolute inset-x-[17%] top-[31%] border-t border-dashed border-blue-500" />
              <div className="absolute bottom-[22%] left-[33%] right-[33%] border-t border-dashed border-blue-500" />
              <div className="absolute bottom-[18%] left-[25%] right-[25%] h-[52%] rounded-[48%] border border-blue-500/80" />
              {[
                'left-[17%] top-[30%]',
                'right-[17%] top-[30%]',
                'left-[33%] bottom-[21%]',
                'right-[33%] bottom-[21%]',
              ].map((position) => (
                <span key={position} className={`absolute h-2 w-2 rounded-full bg-blue-600 ${position}`} />
              ))}
            </div>

            <div className="min-w-0 rounded-lg border border-gray-200 p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Your Face Shape</p>
                  <p className="mt-3 text-3xl font-bold text-gray-950">Square</p>
                  <span className="mt-2 inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                    92% Confidence
                  </span>
                </div>
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm leading-6 text-gray-600">
                Strong, angular features with a defined jawline and balanced facial width.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  ['Face length', 'Medium'],
                  ['Face width', 'Wide'],
                  ['Jawline', 'Strong'],
                  ['Symmetry', 'High'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-[11px] text-gray-500">{label}</p>
                    <p className="text-xs font-semibold text-gray-950">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-w-0 rounded-lg border border-gray-200 p-4 md:col-span-2">
              <p className="mb-3 text-sm font-semibold text-gray-950">Key features</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  'Strong, defined jawline',
                  'Forehead and jaw width align',
                  'Cheekbones moderately prominent',
                  'Balanced proportions',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm leading-5 text-gray-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Glasses className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-semibold text-gray-950">Frames to wear</p>
                </div>
                <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">Top picks</span>
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
                    <p className="mt-1 text-[11px] font-semibold text-green-700">88-94%</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
              <p className="text-sm font-semibold text-gray-950">Try on your top picks</p>
              <p className="mt-1 text-xs leading-5 text-gray-600">
                Move straight from the report into a focused glasses shortlist.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 blur-[1px]">
                {recommendedStyles.map((style) => (
                  <div key={style.name} className="relative aspect-square overflow-hidden rounded-lg bg-white">
                    <Image
                      src="/assets/face-analysis/model-face-square-report.jpg"
                      alt=""
                      fill
                      className="object-cover"
                      sizes="90px"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                Unlock try-on
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
