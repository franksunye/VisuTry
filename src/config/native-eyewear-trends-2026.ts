import type { Locale } from '@/i18n'
import { STYLE_PRESETS_2026, STYLE_GROUPS_2026, STYLE_INTENTS_2026 } from '@/config/native-2026-style-presets'
import { WESTERN_STYLE_CARD_COPIES } from '@/config/native-2026-style-frame-west'
import { OTHER_STYLE_CARD_COPIES } from '@/config/native-2026-style-frame-east'
import { WESTERN_TRENDS_TEXT } from '@/config/native-2026-trends-west'
import { OTHER_TRENDS_TEXT } from '@/config/native-2026-trends-east'
import type { NativeTrendsText } from '@/config/native-2026-trends-types'

const originalTags = [
  [0,1,2],[0,3,4],[0,5,6],[5,0,7],
  [8,5,9],[8,10,1],[8,11,5],[8,12,0],
  [13,14,15],[13,3,16],[14,17,18],[13,19,14],
  [20,21,13],[22,13,17],[12,23,14],[24,25,3],
] as const

export const OFFICIAL_2026_TREND_SOURCES = [
  { title: 'CHANEL Eyewear – Fall Winter 2026', url: 'https://www.chanel.com/us/eyewear/fall-winter-2026-collection/' },
  { title: 'MYKITA × RIMOWA – October 15, 2026', url: 'https://press.rimowa.com/rimowa-and-mykita-unveil-two-new-eyewear-designs-alongside-a-campaign-fronted-by-nina-hoss-leon-dame/?lang=eng' },
] as const

export function getNative2026Trends(locale: Locale) {
  if (locale === 'en') return null
  let copy: NativeTrendsText
  let cardCopies: readonly (readonly [string, string, string])[]
  if (locale === 'es' || locale === 'fr' || locale === 'ru' || locale === 'de') {
    copy = WESTERN_TRENDS_TEXT[locale]
    cardCopies = WESTERN_STYLE_CARD_COPIES[locale]
  } else {
    copy = OTHER_TRENDS_TEXT[locale]
    cardCopies = OTHER_STYLE_CARD_COPIES[locale]
  }

  const cards = STYLE_PRESETS_2026.map((preset, index) => {
    const item = cardCopies[index]
    return {
      ...preset,
      name: item[0],
      signal: item[1],
      bestFor: item[2],
      tags: originalTags[index].map(id => copy.labels.tags[id]),
    }
  })
  return {
    ...copy,
    cards,
    groups: STYLE_GROUPS_2026.map((group,index) => ({
      id: group.id,
      title: copy.groupTitles[index],
      intro: copy.groupIntros[index],
      frames: group.frameIndexes.map(index => cards[index]),
    })),
    intents: STYLE_INTENTS_2026.map((frames,index) => ({
      name: copy.intents[index],
      frames: frames.map(index => cards[index]),
    })),
  }
}
