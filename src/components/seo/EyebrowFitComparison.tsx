import Image from 'next/image'
import { EYEBROW_FIT_IMAGE_PATH } from '@/config/editorial-image-discovery'

/** An original schematic, not a measured fit result or a customer photograph. */
export function EyebrowFitComparison() {
  return (
    <figure id="eyebrow-position-comparison" className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <Image
        src={EYEBROW_FIT_IMAGE_PATH}
        alt="Three illustrated glasses positions: eyebrows above the rim, partial brow overlap, and a frame sitting low near the cheeks"
        width={900}
        height={310}
        unoptimized
        className="h-auto w-full"
      />
      <figcaption>
        <div className="mt-3 grid grid-cols-3 gap-3 text-sm leading-5 text-slate-600">
          <p><strong className="mb-1 block text-slate-950">Brows visible</strong>A clear brow line can work.</p>
          <p><strong className="mb-1 block text-slate-950">Some overlap</strong>A style choice, not a fault.</p>
          <p><strong className="mb-1 block text-slate-950">Sitting low</strong>Check slipping and cheek contact.</p>
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">Illustration only. A photo can show appearance; an optician checks physical fit.</p>
      </figcaption>
    </figure>
  )
}
