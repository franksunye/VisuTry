import { render } from '@testing-library/react'
import GlassesForFaceShapePage from '@/app/[locale]/(public)/glasses-for-face-shape/page'
import { FACE_SHAPE_SLUGS } from '@/config/face-shape-content'
import { getFaceShapeSeoCopy } from '@/config/face-shape-seo-locales'

jest.mock('@/components/layout/PublicLink', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

jest.mock('@/components/growth/SearchToToolLanding', () => ({
  SearchToToolLanding: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}))

describe('glasses-for-face-shape localized guide discovery links', () => {
  it.each(['en', 'id', 'ar', 'ru', 'de', 'ja', 'es', 'pt', 'fr'])(
    '%s hub links each face shape to its same-locale detailed guide',
    (locale) => {
      const { container } = render(GlassesForFaceShapePage({ params: { locale } }))
      const shapeNames = getFaceShapeSeoCopy(locale).shapeNames

      for (const shape of FACE_SHAPE_SLUGS) {
        const link = container.querySelector<HTMLAnchorElement>(
          `a[href="/${locale}/style/${shape}-face"]`,
        )
        expect(link).not.toBeNull()
        expect(link?.textContent?.trim()).toBe(shapeNames[shape])
      }
    },
  )
})
