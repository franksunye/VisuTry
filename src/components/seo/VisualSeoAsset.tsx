import Image from 'next/image'
import Link from 'next/link'
import type { VisualSeoAsset as VisualSeoAssetData } from '@/config/visual-seo-assets'

type VisualSeoAssetProps = {
  asset: VisualSeoAssetData
}

export function VisualSeoAsset({ asset }: VisualSeoAssetProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="mb-4 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
        {asset.heading}
      </h2>
      <figure>
        <Image
          src={asset.publicPath}
          alt={asset.alt}
          width={asset.width}
          height={asset.height}
          sizes="(max-width: 768px) 100vw, 960px"
          className="h-auto w-full rounded-xl border border-slate-100 bg-slate-50"
        />
        <figcaption className="pt-4">
          <p className="text-base leading-7 text-slate-600">{asset.body}</p>
          {asset.link ? (
            <Link
              href={asset.link.href}
              className="mt-4 inline-flex items-center font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900"
            >
              {asset.link.label} <span aria-hidden="true" className="ml-1">→</span>
            </Link>
          ) : null}
        </figcaption>
      </figure>
    </article>
  )
}
