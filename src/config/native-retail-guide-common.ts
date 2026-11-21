import type { Locale } from '@/i18n'
import type { NativeEditorialCopy } from '@/components/blog/NativeEditorialArticle'
import { getNativeChoiceGuide } from '@/config/native-choice-between-frames'

export const NON_EN_BLOG_LOCALES = ['id', 'ar', 'ru', 'de', 'ja', 'es', 'pt', 'fr'] as const satisfies readonly Locale[]
export type NativeBlogLocale = (typeof NON_EN_BLOG_LOCALES)[number]

export type LocalizedRetailArticle = Pick<
  NativeEditorialCopy, 'title' | 'description' | 'imageAlt' | 'imageCaption' | 'sections'
> & {
  category: string
  readTime: string
  /** Brand/source labels are localized too; URLs point to original primary evidence. */
  sources?: NativeEditorialCopy['sources']
  comparisonTable?: NativeEditorialCopy['comparisonTable']
  merchantCta?: NativeEditorialCopy['merchantCta']
  faq?: NativeEditorialCopy['faq']
  /** Related article is already localized or the English-only fallback is explicitly disclosed. */
  relatedLabel?: string
}

const dates: Record<NativeBlogLocale, { published: string; updated: string }> = {
  id: { published: 'Terbit', updated: 'Diperbarui' },
  ar: { published: 'نُشر', updated: 'حُدّث' },
  ru: { published: 'Опубликовано', updated: 'Обновлено' },
  de: { published: 'Veröffentlicht', updated: 'Aktualisiert' },
  ja: { published: '公開', updated: '更新' },
  es: { published: 'Publicado', updated: 'Actualizado' },
  pt: { published: 'Publicado', updated: 'Atualizado' },
  fr: { published: 'Publié', updated: 'Mis à jour' },
}

export function makeNativeRetailArticle(
  locale: NativeBlogLocale,
  article: LocalizedRetailArticle,
  publishedAt: string,
  modifiedAt: string,
): NativeEditorialCopy {
  const shared = getNativeChoiceGuide(locale)
  if (!shared) throw new Error('Native locale not available: ' + locale)
  const date = (iso: string) => new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(iso))
  return {
    ...shared,
    ...article,
    publishedLabel: dates[locale].published + ' ' + date(publishedAt),
    updatedLabel: dates[locale].updated + ' ' + date(modifiedAt),
  }
}
