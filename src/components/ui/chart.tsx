'use client'

import type { CSSProperties, ReactElement, ReactNode } from 'react'
import { ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

export type ChartConfig = Record<string, { label: string; color: string }>

export function ChartContainer({
  config,
  className,
  children,
}: {
  config: ChartConfig
  className?: string
  children: ReactNode
}) {
  const variables = Object.fromEntries(
    Object.entries(config).map(([key, item]) => [`--color-${key}`, item.color]),
  ) as CSSProperties

  return <div data-slot="chart" className={cn('w-full min-w-0', className)} style={variables}>
    <ResponsiveContainer width="100%" height="100%" debounce={80}>
      {children as ReactElement}
    </ResponsiveContainer>
  </div>
}

type TooltipRow = {
  color?: string
  dataKey?: unknown
  name?: unknown
  value?: unknown
}

export function ChartTooltipContent({
  active,
  label,
  payload,
  config,
  labelFormatter,
  locale = 'en',
}: {
  active?: boolean
  label?: string | number
  payload?: readonly TooltipRow[]
  config: ChartConfig
  labelFormatter?: (label: string | number | undefined) => string
  locale?: string
}) {
  if (!active || !payload?.length) return null
  const rows = payload.filter((item) => item.value !== null && item.value !== undefined)
  if (rows.length === 0) return null

  return <div role="status" aria-live="polite" className="min-w-36 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg shadow-slate-900/10">
    {label !== undefined ? <p className="mb-1.5 text-[11px] font-semibold text-slate-700">{labelFormatter?.(label) ?? label}</p> : null}
    <ul className="space-y-1">
      {rows.map((item, index) => {
        const key = String(item.dataKey ?? '')
        const series = config[key]
        const raw = item.value
        const value = typeof raw === 'number' ? new Intl.NumberFormat(locale).format(raw) : String(raw)
        return <li key={`${key}-${index}`} className="flex items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color ?? series?.color ?? '#64748b' }} />
            {series?.label ?? String(item.name ?? key)}
          </span>
          <span className="font-semibold tabular-nums text-slate-950">{value}</span>
        </li>
      })}
    </ul>
  </div>
}
