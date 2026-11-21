import { StaticContentImage } from '@/components/seo/StaticContentImage'
import Link from '@/components/layout/PublicLink'
import type { VisualSeoAsset } from '@/config/visual-seo-assets'
import { DETECTOR_RESULT_EXAMPLE } from '@/config/detector-result-example'

/**
 * A recorded run, not a second detector or a personalized report. Keep the
 * provenance and captured ratios together when refreshing this static example.
 */
export function DetectorResultExample({ asset }: { asset: VisualSeoAsset }) {
  const example = DETECTOR_RESULT_EXAMPLE

  return (
    <article aria-labelledby="detector-example-title" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <h2 id="detector-example-title" className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
        {asset.heading}
      </h2>
      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
        <figure className="min-w-0">
          <StaticContentImage
            src={asset.publicPath}
            alt={asset.alt}
            width={asset.width}
            height={asset.height}
            className="h-auto w-full rounded-lg border border-slate-200"
          />
          <figcaption className="mt-2 text-xs leading-5 text-slate-500">
            Actual on-device result from a synthetic demo photo.
            Photo quality is not an accuracy score.
          </figcaption>
        </figure>

        <div className="min-w-0">
          <p className="text-base leading-7 text-slate-700">{example.explanation}</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Free, on-device face shape detection. Personalized glasses recommendations
            and Top Picks are available in the optional paid Advisor report.
          </p>
          {asset.link ? (
            <Link href={asset.link.href} className="mt-3 inline-flex text-sm font-semibold leading-6 text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900">
              {asset.link.label} <span aria-hidden="true" className="ml-1">→</span>
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  )
}
