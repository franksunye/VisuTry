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
  const measurements = [
    { label: 'Face length ÷ face width', value: example.ratios.faceAspectRatio },
    { label: 'Forehead ÷ cheekbone width', value: example.ratios.foreheadToCheekWidth },
    { label: 'Jaw ÷ cheekbone width', value: example.ratios.jawToCheekWidth },
  ]

  return (
    <article aria-labelledby="detector-example-title" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <h2 id="detector-example-title" className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
        {asset.heading}
      </h2>
      <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
        We ran this synthetic demo portrait through the free detector above.
        The screenshot shows its actual result, calculated in the browser.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
        <figure className="min-w-0">
          <StaticContentImage
            src={asset.publicPath}
            alt={asset.alt}
            width={asset.width}
            height={asset.height}
            className="h-auto w-full rounded-lg border border-slate-200"
          />
          <figcaption className="mt-3 text-sm leading-6 text-slate-600">
            The photo-quality badge rates the input photo, not the accuracy of the shape estimate.
          </figcaption>
        </figure>

        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-slate-950">What the proportions mean</h3>
          <dl className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 px-4">
            {measurements.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-4 py-3">
                <dt className="text-sm leading-6 text-slate-700">{label}</dt>
                <dd className="shrink-0 text-lg font-semibold tabular-nums text-slate-950">{value.toFixed(2)}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm leading-7 text-slate-700">{example.explanation}</p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            These compare visible landmark spans, not millimetres or a frame-size prescription.
            If a photo is tilted or your face is partly hidden, take another straight-on photo.
            Close matches between shapes are useful starting points, not fixed labels.
          </p>
        </div>
      </div>
      <p className="mt-5 border-t border-slate-200 pt-4 text-sm leading-7 text-slate-600">
        The free detector estimates face shape on your device. Personalized glasses recommendations
        and Top Picks belong to the optional paid Advisor report.
      </p>
      {asset.link ? (
        <Link href={asset.link.href} className="mt-3 inline-flex text-sm font-semibold leading-6 text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900">
          {asset.link.label} <span aria-hidden="true" className="ml-1">→</span>
        </Link>
      ) : null}
    </article>
  )
}
