import ar from '../../../messages/ar.json'
import de from '../../../messages/de.json'
import en from '../../../messages/en.json'
import es from '../../../messages/es.json'
import fr from '../../../messages/fr.json'
import id from '../../../messages/id.json'
import ja from '../../../messages/ja.json'
import pt from '../../../messages/pt.json'
import ru from '../../../messages/ru.json'

const locales = { ar, de, es, fr, id, ja, pt, ru }
const englishExperience = en.storeShopper.experience
const experienceKeys = Object.keys(englishExperience)

describe('Store shopper experience translations', () => {
  it.each(Object.entries(locales))('%s has the complete localized experience copy', (_locale, messages) => {
    const experience = messages.storeShopper.experience

    expect(Object.keys(experience).sort()).toEqual([...experienceKeys].sort())

    for (const key of experienceKeys) {
      expect(experience[key as keyof typeof experience]).not.toBe(
        englishExperience[key as keyof typeof englishExperience],
      )
    }
  })

  it.each([
    ['en', en.storeShopper.experience.ctaSupport],
    ...Object.entries(locales).map(([locale, messages]) => [locale, messages.storeShopper.experience.ctaSupport]),
  ])('%s keeps CTA support copy independent of entitlement wording', (_locale, ctaSupport) => {
    expect(ctaSupport).not.toMatch(/consumer\s+credits?|quota|entitlement|sponsored/i)
  })
})
