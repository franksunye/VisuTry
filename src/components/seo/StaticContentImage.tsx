import Image, { type ImageProps } from 'next/image'

export type StaticContentImageProps = Omit<ImageProps, 'unoptimized'>

/**
 * Use only for immutable, repository-owned public content that already has a
 * crawlable static URL. Responsive/user-generated images must keep the normal
 * Next Image optimizer path.
 */
export function StaticContentImage({ alt, ...props }: StaticContentImageProps) {
  return <Image {...props} alt={alt} unoptimized />
}

export function isGovernedStaticSeoImagePath(src: string) {
  return /^\/images\/seo\/[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*\.webp$/.test(src)
}
