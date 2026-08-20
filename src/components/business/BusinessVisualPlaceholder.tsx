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

export function BusinessVisualPlaceholder({
  id,
  name,
  ratio = '16:10',
  status,
  className = '',
}: BusinessVisualPlaceholderProps) {
  const aspect = ratio === '4:3' ? 'aspect-[4/3]' : ratio === '4:5' ? 'aspect-[4/5]' : 'aspect-[16/10]'

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
