import NextLink from 'next/link'
import type { ComponentProps } from 'react'

type PublicLinkProps = ComponentProps<typeof NextLink>

/**
 * Public-content navigation is user-driven by default. Keeping the policy in
 * one small wrapper prevents high-link-density SEO pages from issuing
 * speculative RSC/Flight requests as links enter the viewport.
 *
 * A caller may opt into prefetching explicitly when a public surface has a
 * measured, user-visible reason to do so.
 */
export function PublicLink({ prefetch = false, ...props }: PublicLinkProps) {
  return <NextLink {...props} prefetch={prefetch} />
}

export default PublicLink
