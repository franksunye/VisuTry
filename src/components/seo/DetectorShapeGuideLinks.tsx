import Link from '@/components/layout/PublicLink'
import { FACE_SHAPE_CONTENT, FACE_SHAPE_SLUGS } from '@/config/face-shape-content'

/** Static follow-up paths after a free face-shape result; no detection or server work. */
export function DetectorShapeGuideLinks() {
  return (
    <section aria-labelledby="detector-shape-guides" className="mt-12">
      <h2 id="detector-shape-guides" className="text-2xl font-bold text-gray-950">
        What each face-shape result means when choosing glasses
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-600">
        The free test is a styling estimate, not a definitive label. These guides explain
        the seven possible results and frame directions worth comparing on your own photo.
        Width, comfort and personal preference still matter.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FACE_SHAPE_SLUGS.map((shape) => {
          const guide = FACE_SHAPE_CONTENT[shape]
          return (
            <article key={shape} className="rounded-lg border border-gray-200 bg-white p-5">
              <h3 className="font-semibold text-gray-950">
                <Link href={`/en/style/${guide.styleSlug}`} prefetch={false}
                  className="text-blue-700 hover:text-blue-900">
                  {guide.name} face: glasses guide
                </Link>
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{guide.shortDefinition}</p>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                <strong>Try first:</strong> {guide.glasses.tryFirst.slice(0, 2).join(' · ')}
              </p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
