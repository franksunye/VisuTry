import type { ExperienceSearchReadiness, ExperienceSearchVisibilityReason } from '@/modules/store/domain/experience-search-visibility'

function reasonMessage(reason: ExperienceSearchVisibilityReason, status: ExperienceSearchReadiness): string {
  switch (reason) {
    case 'MISSING_MERCHANT':
      return 'Set up the merchant before making this page public.'
    case 'MISSING_EXPERIENCE':
      return 'Create and save this page first.'
    case 'MERCHANT_INACTIVE':
      return 'The merchant must be active before this page can be available in search.'
    case 'DRAFT':
      return 'Publish the saved page to make it publicly available.'
    case 'NO_READABLE_CONTENT':
      return 'Add a merchant name, page title and at least one active product.'
    case 'EXPERIENCE_ENDED':
      return 'This page has ended and is excluded from search.'
    case 'EXPERIENCE_ARCHIVED':
      return 'This page is archived and is excluded from search.'
    case 'EXPERIENCE_INACTIVE':
      return 'Activate this page before making it publicly available.'
    case 'REFERENCE':
      return 'Reference collections are available by link and excluded from search.'
    case 'MERCHANT_NOT_INDEXABLE':
      return 'This merchant is currently excluded from search. Contact support if this is a live merchant page.'
    case 'INSUFFICIENT_FRAMES':
      return `Select at least ${status.minimumFrameCount} active products for this collection. Currently: ${status.activeFrameCount}.`
    case 'MISSING_DESTINATION':
      return 'Add a valid merchant website or a product destination link.'
  }
}

export function MerchantSearchVisibility({ status }: { status: ExperienceSearchReadiness }) {
  const eligible = status.visibility === 'PUBLIC_INDEX'
  const privatePage = status.visibility === 'PRIVATE'
  const label = privatePage
    ? 'Private'
    : eligible ? 'Public · eligible for search' : 'Public · not eligible for search'
  const tone = eligible
    ? 'bg-emerald-50 text-emerald-800'
    : privatePage ? 'bg-slate-100 text-slate-700' : 'bg-amber-50 text-amber-800'

  return <section data-testid="merchant-search-visibility" aria-label="Search visibility" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-base font-semibold text-slate-950">Search visibility</h2>
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span>
    </div>
    {status.reasons.length > 0 ? <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
      {status.reasons.map((reason) => <li key={reason}>{reasonMessage(reason, status)}</li>)}
    </ul> : <p className="mt-3 text-sm leading-6 text-slate-700">The saved page allows search engines to index it.</p>}
    <p className="mt-3 text-xs leading-5 text-slate-500">Based on saved content. Search eligibility applies to the English public page. Search engines decide whether and when to include it in results.</p>
  </section>
}
