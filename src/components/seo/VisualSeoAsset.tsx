import Image from 'next/image'
import Link from 'next/link'
import type { VisualSeoAsset as VisualSeoAssetData } from '@/config/visual-seo-assets'

type VisualSeoAssetProps = {
  asset: VisualSeoAssetData
  variant?: 'default' | 'compact'
}

export function VisualSeoAsset({ asset, variant = 'default' }: VisualSeoAssetProps) {
  const isCompact = variant === 'compact'

  if (isCompact) {
    return (
      <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <figure className="grid grid-cols-[112px_minmax(0,1fr)] gap-3 sm:block">
          <Image
            src={asset.publicPath}
            alt={asset.alt}
            width={asset.width}
            height={asset.height}
            sizes="(max-width: 639px) 112px, (max-width: 768px) 100vw, 480px"
            className="h-[84px] w-[112px] rounded-lg border border-slate-100 bg-slate-50 object-cover sm:h-auto sm:w-full sm:rounded-xl"
          />
          <figcaption className="min-w-0 sm:pt-3">
            <h2 className="text-base font-bold leading-5 tracking-tight text-slate-950 sm:text-xl">
              {asset.heading}
            </h2>
            <p className="mt-2 hidden text-sm leading-6 text-slate-600 sm:block">{asset.body}</p>
            {asset.link ? (
              <Link
                href={asset.link.href}
                className="mt-2 inline-flex text-sm font-semibold leading-5 text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900 sm:mt-3"
              >
                {asset.link.label} <span aria-hidden="true" className="ml-1">→</span>
              </Link>
            ) : null}
          </figcaption>
        </figure>
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:hidden">{asset.body}</p>
      </article>
    )
  }

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
