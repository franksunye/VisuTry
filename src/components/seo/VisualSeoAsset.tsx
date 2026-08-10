import Image from 'next/image'
import Link from 'next/link'
import type { VisualSeoAsset as VisualSeoAssetData } from '@/config/visual-seo-assets'

type VisualSeoAssetProps = {
  asset: VisualSeoAssetData
  variant?: 'default' | 'compact'
}

export function VisualSeoAsset({ asset, variant = 'default' }: VisualSeoAssetProps) {
  const isCompact = variant === 'compact'

  return (
    <article
      className={
        isCompact
          ? 'rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4'
          : 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6'
      }
    >
      <h2
        className={
          isCompact
            ? 'mb-3 text-lg font-bold tracking-tight text-slate-950 sm:text-xl'
            : 'mb-4 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl'
        }
      >
        {asset.heading}
      </h2>
      <figure>
        <Image
          src={asset.publicPath}
          alt={asset.alt}
          width={asset.width}
          height={asset.height}
          sizes={isCompact ? '(max-width: 768px) 100vw, 480px' : '(max-width: 768px) 100vw, 960px'}
          className="h-auto w-full rounded-xl border border-slate-100 bg-slate-50"
        />
        <figcaption className={isCompact ? 'pt-3' : 'pt-4'}>
          <p className={isCompact ? 'text-sm leading-6 text-slate-600' : 'text-base leading-7 text-slate-600'}>
            {asset.body}
          </p>
          {asset.link ? (
            <Link
              href={asset.link.href}
              className={`${isCompact ? 'mt-3 text-sm' : 'mt-4'} inline-flex items-center font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900`}
            >
              {asset.link.label} <span aria-hidden="true" className="ml-1">→</span>
            </Link>
          ) : null}
        </figcaption>
      </figure>
    </article>
  )
}
