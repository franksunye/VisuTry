import Link from 'next/link'
import { ArrowRight, Grid2X2 } from 'lucide-react'
import { CompareLandingSlides } from '@/components/marketing/CompareLandingSlides'

interface CompareLandingVisualProps {
  locale: string
  startHref?: string
}

export function CompareLandingVisual({
  locale,
  startHref = `/${locale}/try-on/glasses/compare`,
}: CompareLandingVisualProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[0.34fr_0.66fr] lg:items-stretch">
        <div className="flex flex-col justify-center bg-gradient-to-br from-white via-blue-50 to-white p-6 lg:p-8">
          <p className="mb-3 inline-flex w-fit items-center rounded-lg border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-700">
            <Grid2X2 className="mr-2 h-4 w-4" />
            Preset Frame Compare
          </p>
          <h2 className="text-3xl font-bold leading-tight text-gray-950 md:text-4xl">
            Compare preset frames in one clean board
          </h2>
          <p className="mt-4 text-base leading-7 text-gray-600">
            Pick built-in frame shapes, generate each look from the same portrait, and review the
            results side by side before shopping for a specific product.
          </p>
          <div className="mt-6 grid gap-3 text-sm font-semibold text-gray-700">
            <span>16 common frame presets</span>
            <span>One credit per generated frame</span>
            <span>Desktop and mobile comparison views</span>
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href={startHref}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
            >
              Start comparing
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/${locale}/pricing`}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-700 hover:border-blue-300 hover:text-blue-700"
            >
              View credits
            </Link>
          </div>
        </div>

        <div className="bg-[#eef5ff] p-3 lg:p-5">
          <CompareLandingSlides />
        </div>
      </div>
    </section>
  )
}
