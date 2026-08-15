import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/programmatic-seo'
import { isCuratedBrandSlug } from '@/config/brand-try-on-content'
import { getCachedPublicExperienceSitemapEntries } from '@/lib/store-discovery-sitemap'
import { serializeSitemap, type SitemapEntry } from '@/lib/sitemap-xml'
import { buildSitemapAlternates } from '@/lib/sitemap-static'
import { locales } from '@/i18n'

export const revalidate = 24 * 60 * 60

export async function GET() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.visutry.com').replace(/\/+$/, '')
  const programmaticEnabled = process.env.PROGRAMMATIC_SEO_ENABLED === 'true'
  const entries: SitemapEntry[] = []

  if (programmaticEnabled) {
    try {
      const frames = await prisma.glassesFrame.findMany({
        where: { isActive: true },
        select: { id: true, updatedAt: true },
      })
      frames.forEach((frame) => {
        const path = `/try/${frame.id}`
        locales.forEach((locale) => {
          entries.push({
            url: `${baseUrl}/${locale}${path}`,
            lastModified: frame.updatedAt,
            changeFrequency: 'monthly',
            priority: 0.8,
            alternates: { languages: buildSitemapAlternates(baseUrl, path) },
          })
        })
      })
    } catch {
      console.log('Unable to fetch product pages, skipping product sitemap generation')
    }

    try {
      const shapes = await prisma.faceShape.findMany({
        select: { name: true, updatedAt: true },
      })
      shapes.forEach((shape) => {
        const path = `/style/${slugify(shape.name)}`
        entries.push({
          url: `${baseUrl}/en${path}`,
          lastModified: shape.updatedAt,
          changeFrequency: 'monthly',
          priority: 0.7,
          alternates: { languages: { en: `${baseUrl}/en${path}` } },
        })
      })
    } catch {
      console.log('Unable to fetch face shape pages, skipping face shape sitemap generation')
    }

    try {
      const categories = await prisma.glassesCategory.findMany({
        select: { name: true, updatedAt: true },
      })
      categories.forEach((category) => {
        const path = `/category/${slugify(category.name)}`
        locales.forEach((locale) => {
          entries.push({
            url: `${baseUrl}/${locale}${path}`,
            lastModified: category.updatedAt,
            changeFrequency: 'monthly',
            priority: 0.7,
            alternates: { languages: buildSitemapAlternates(baseUrl, path) },
          })
        })
      })
    } catch {
      console.log('Unable to fetch category pages, skipping category sitemap generation')
    }

    try {
      const brands = await prisma.glassesFrame.findMany({
        where: { isActive: true },
        distinct: ['brand'],
        select: { brand: true, updatedAt: true },
      })
      brands
        .filter((brand): brand is { brand: string; updatedAt: Date } => Boolean(brand.brand))
        .forEach((brand) => {
          const path = `/brand/${slugify(brand.brand)}`
          if (isCuratedBrandSlug(slugify(brand.brand))) return
          locales.forEach((locale) => {
            entries.push({
              url: `${baseUrl}/${locale}${path}`,
              lastModified: brand.updatedAt,
              changeFrequency: 'monthly',
              priority: 0.6,
              alternates: { languages: buildSitemapAlternates(baseUrl, path) },
            })
          })
        })
    } catch {
      console.log('Unable to fetch brand pages, skipping brand page generation')
    }
  }

  try {
    const publicExperiencePages: MetadataRoute.Sitemap = await getCachedPublicExperienceSitemapEntries(baseUrl)
    entries.push(...publicExperiencePages)
  } catch {
    console.log('Unable to fetch public Store/Campaign pages, skipping discovery sitemap entries')
  }

  return new Response(serializeSitemap(entries), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'CDN-Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}
