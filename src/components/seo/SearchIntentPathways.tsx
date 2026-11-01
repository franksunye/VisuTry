import Link from '@/components/layout/PublicLink'

type Intent = 'selection' | 'frame-ready'

const paths = {
  selection: {
    question: 'Not sure which glasses suit your face?',
    answer: 'Start with a free face-shape estimate and frame shortlist. You do not need to choose a specific product yet.',
    related: [
      { label: 'Check my face shape free', href: '/en/face-shape-detector' },
      { label: 'I already have a frame photo to try', href: '/en/try-glasses-on-photo' },
    ],
  },
  'frame-ready': {
    question: 'Already found a pair you want to try?',
    answer: 'Virtual try-on needs your portrait and a separate product photo or retailer screenshot of the exact frame. The image is not preloaded from a guide.',
    related: [
      { label: 'Help me choose a frame first', href: '/en/find-glasses-for-my-face' },
      { label: 'I want to compare multiple frames', href: '/en/compare-glasses-frames' },
    ],
  },
} as const

/** Explicitly distinguishes shortlist intent from exact-frame try-on, without changing canonicals. */
export function SearchIntentPathways({ intent }: { intent: Intent }) {
  const copy = paths[intent]
  return (
    <aside aria-label="Choose your glasses decision path" className="mt-5 max-w-2xl rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="font-semibold text-gray-950">{copy.question}</p>
      <p className="mt-1 text-sm leading-6 text-gray-600">{copy.answer}</p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
        {copy.related.map((item) => (
          <Link key={item.href} href={item.href} prefetch={false} className="text-blue-700 hover:text-blue-900">
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  )
}
