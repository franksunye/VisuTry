import Image, { type ImageProps } from 'next/image'

export type StaticContentImageProps = Omit<ImageProps, 'unoptimized' | 'src'> & {
  src: string
  desktopOnly?: boolean
}

/**
 * Use only for immutable, repository-owned public content that already has a
 * crawlable static URL. When the source is not a good mobile-sized asset,
 * desktopOnly keeps smaller responsive slots on the normal Next Image path.
 */
export function StaticContentImage({ alt, src, desktopOnly = false, ...props }: StaticContentImageProps) {
  if (!desktopOnly) return <Image {...props} alt={alt} src={src} unoptimized />

  return (
    <picture className="contents">
      <source media="(min-width: 768px)" srcSet={src} />
      <Image {...props} alt={alt} src={src} />
    </picture>
  )
}

export function isGovernedStaticSeoImagePath(src: string) {
  return /^\/images\/seo\/[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*\.webp$/.test(src)
}
