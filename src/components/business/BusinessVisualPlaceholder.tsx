type PlaceholderStatus =
  | 'DIRECT'
  | 'NEEDS STORE CAPTURE'
  | 'NEEDS CAMPAIGN CAPTURE'
  | 'NEEDS MERCHANT CAPTURE'
  | 'NEEDS INSIGHTS CAPTURE'
  | 'NEEDS REFERENCE CAPTURES'

interface BusinessVisualPlaceholderProps {
  id: string
  name: string
  ratio?: '16:10' | '4:3' | '4:5'
  status: PlaceholderStatus
  className?: string
}

type BusinessVisualAsset = {
  src: string
  alt: string
}

function getBusinessVisualAsset(id: string, ratio: '16:10' | '4:3' | '4:5'): BusinessVisualAsset | null {
  switch (id) {
    case 'B2B-VIS-01':
      return {
        src: '/images/business/b2b-vis-01-business-hero-main.png',
        alt: 'VisuTry Business eyewear commerce platform hero visual',
      }
    case 'B2B-VIS-02':
      return {
        src: '/images/business/b2b-vis-02-platform-catalog-to-experience-main.png',
        alt: 'VisuTry platform visual showing one eyewear catalog powering Store and Campaign experiences',
      }
    case 'B2B-VIS-03':
      return ratio === '4:3'
        ? {
            src: '/images/business/b2b-vis-03-store-experience-detail.png',
            alt: 'VisuTry Store discovery, recommendation, Try-On, and Compare experience detail',
          }
        : {
            src: '/images/business/b2b-vis-03-store-experience-main.png',
            alt: 'VisuTry Store eyewear shopping experience visual',
          }
    case 'B2B-VIS-04':
      return {
        src: '/images/business/b2b-vis-04-campaign-experience-main.png',
        alt: 'VisuTry focused eyewear Campaign Experience visual',
      }
    case 'B2B-VIS-05':
      return {
        src: '/images/business/b2b-vis-05-merchant-workspace-main.png',
        alt: 'VisuTry Merchant Workspace operating Store, Campaigns, and insights',
      }
    case 'B2B-VIS-06':
      return {
        src: '/images/business/b2b-vis-06-commerce-intelligence-main.png',
        alt: 'VisuTry Commerce Intelligence visual with shopper engagement and intent signals',
      }
    case 'B2B-VIS-07':
      return {
        src: '/images/business/b2b-vis-07-reference-experiences-main.png',
        alt: 'VisuTry reference eyewear experiences across different brand and merchandising directions',
      }
    default:
      return null
  }
}

export function BusinessVisualPlaceholder({
  id,
  name,
  ratio = '16:10',
  status,
  className = '',
}: BusinessVisualPlaceholderProps) {
  const aspect = ratio === '4:3' ? 'aspect-[4/3]' : ratio === '4:5' ? 'aspect-[4/5]' : 'aspect-[16/10]'
  const asset = getBusinessVisualAsset(id, ratio)

  if (asset) {
    const contain = id === 'B2B-VIS-07'
    const eager = ['B2B-VIS-01', 'B2B-VIS-02', 'B2B-VIS-03', 'B2B-VIS-04', 'B2B-VIS-06'].includes(id)

    return (
      <figure
        className={`relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_28px_90px_-46px_rgba(15,23,42,0.32)] ${aspect} ${className}`}
        data-business-visual={id}
      >
        <img
          src={asset.src}
          alt={asset.alt}
          className={`h-full w-full ${contain ? 'object-contain' : 'object-cover'}`}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
        />
      </figure>
    )
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-dashed border-slate-300 bg-[linear-gradient(145deg,#ffffff_0%,#f8fafc_55%,#eff6ff_100%)] ${aspect} ${className}`}
      data-business-visual={id}
      aria-label={`${id} ${name} placeholder`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_16%,rgba(59,130,246,0.10),transparent_28%)]" />
      <div className="relative flex h-full flex-col justify-between p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700">{id}</span>
          <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{ratio}</span>
        </div>
        <div className="max-w-md">
          <p className="text-2xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-3xl">{name}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{status}</p>
        </div>
      </div>
    </div>
  )
}
