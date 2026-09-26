'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import QRCode from 'qrcode'

export function DecisionResultQr({ value }: { value: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(value, { width: 240, margin: 1, errorCorrectionLevel: 'M' })
      .then((next) => {
        if (!cancelled) setDataUrl(next)
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [value])

  if (!dataUrl) return <div className="flex h-48 w-48 items-center justify-center rounded-2xl bg-slate-100 text-center text-xs text-slate-500">QR unavailable. Copy the result link instead.</div>
  return <Image src={dataUrl} alt="Scan to open this Decision Result on another device" width={192} height={192} unoptimized className="h-48 w-48 rounded-2xl bg-white p-2" />
}
