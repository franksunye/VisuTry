import Image from 'next/image'
import Link from 'next/link'
import type { VisualSeoAsset as VisualSeoAssetData } from '@/config/visual-seo-assets'

type VisualSeoAssetProps = {
  asset: VisualSeoAssetData
  variant?: 'default' | 'compact' | 'editorial' | 'owner-editorial' | 'supporting-wide'
  headingDisplay?: 'visible' | 'sr-only'
}

export function VisualSeoAsset({
  asset,
  variant = 'default',
  headingDisplay = 'visible',
}: VisualSeoAssetProps) {
  const isCompact = variant === 'compact'
  const isEditorial = variant === 'editorial' || variant === 'owner-editorial'
  const isOwnerEditorial = variant === 'owner-editorial'
  const isSupportingWide = variant === 'supporting-wide'
  const displayWidth = isOwnerEditorial
    ? asset.displayWidth === 'secondary' ? 'max-w-4xl' : 'max-w-5xl'
    : asset.displayWidth === 'secondary' ? 'max-w-4xl' : 'max-w-6xl'
  const body = <p className="text-base leading-7 text-slate-600">{asset.body}</p>
  const headingClass = (visibleClassName: string) => (headingDisplay === 'sr-only' ? 'sr-only' : visibleClassName)

  if (isCompact) {
    return (
      <article className="grid grid-cols-[112px_minmax(0,1fr)] gap-x-3 gap-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:block md:p-4">
        <figure className="col-start-1 row-start-1">
          <Image
            src={asset.publicPath}
            alt={asset.alt}
            width={asset.width}
            height={asset.height}
            sizes="(max-width: 767px) 112px, 480px"
            className="h-[84px] w-[112px] rounded-lg border border-slate-100 bg-slate-50 object-cover md:h-auto md:w-full md:rounded-xl"
          />
        </figure>
        <div className="col-start-2 row-start-1 min-w-0 md:pt-3">
          <h2 className={headingClass('text-base font-bold leading-5 tracking-tight text-slate-950 md:text-xl')}>
            {asset.heading}
          </h2>
        </div>
        <p className="col-span-2 row-start-2 text-sm leading-6 text-slate-600 md:mt-2">{asset.body}</p>
        {asset.link ? (
          <Link
            href={asset.link.href}
            className="col-span-2 row-start-3 inline-flex text-sm font-semibold leading-5 text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900 md:mt-3"
          >
            {asset.link.label} <span aria-hidden="true" className="ml-1">→</span>
          </Link>
        ) : null}
      </article>
    )
  }

  if (isSupportingWide) {
    return (
      <article className="grid grid-cols-[112px_minmax(0,1fr)] gap-x-3 gap-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-[minmax(280px,40%)_minmax(0,1fr)] md:items-start md:gap-x-6 md:gap-y-2 md:p-4">
        <figure className="col-start-1 row-start-1 md:row-span-3">
          <Image
            src={asset.publicPath}
            alt={asset.alt}
            width={asset.width}
            height={asset.height}
            sizes="(max-width: 767px) 112px, 420px"
            className="h-[84px] w-[112px] rounded-lg border border-slate-100 bg-slate-50 object-cover md:h-auto md:w-full md:rounded-xl"
          />
        </figure>
        <div className="col-start-2 row-start-1 min-w-0 md:self-end">
          <h2 className={headingClass('text-base font-bold leading-5 tracking-tight text-slate-950 md:text-2xl')}>
            {asset.heading}
          </h2>
        </div>
        <p className="col-span-2 row-start-2 text-sm leading-6 text-slate-600 md:col-span-1 md:col-start-2 md:text-base md:leading-7">
          {asset.body}
        </p>
        {asset.link ? (
          <Link
            href={asset.link.href}
            className="col-span-2 row-start-3 inline-flex text-sm font-semibold leading-5 text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900 md:col-span-1 md:col-start-2 md:text-base"
          >
            {asset.link.label} <span aria-hidden="true" className="ml-1">→</span>
          </Link>
        ) : null}
      </article>
    )
  }

  if (isEditorial) {
    return (
      <article className={`mx-auto ${displayWidth}`}>
        <h2 className={headingClass('mb-4 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl')}>
          {asset.heading}
        </h2>
        {asset.bodyPosition === 'before' ? <div className="mb-5">{body}</div> : null}
        <figure>
          <Image
            src={asset.publicPath}
            alt={asset.alt}
            width={asset.width}
            height={asset.height}
            sizes="(max-width: 768px) 100vw, 1120px"
            className="h-auto w-full"
          />
          <figcaption className="pt-4">
            {asset.bodyPosition === 'before' ? null : body}
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

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className={headingClass('mb-4 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl')}>
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
