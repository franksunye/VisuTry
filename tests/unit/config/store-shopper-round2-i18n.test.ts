import { locales } from '@/i18n'
import en from '../../../messages/en.json'
import id from '../../../messages/id.json'
import ar from '../../../messages/ar.json'
import ru from '../../../messages/ru.json'
import de from '../../../messages/de.json'
import ja from '../../../messages/ja.json'
import es from '../../../messages/es.json'
import pt from '../../../messages/pt.json'
import fr from '../../../messages/fr.json'

const NEW_STORE_KEYS = [
  'storeShopper.recommend.tryOnThisFrame',
  'storeShopper.tryOn.startOne',
  'storeShopper.tryOn.timedOut',
  'storeShopper.tryOn.checkAgain',
  'storeShopper.tryOn.tryAgain',
  'storeShopper.errors.sessionRestart',
  'storeShopper.errors.capabilityUnavailable',
] as const

const messagesByLocale: Record<string, unknown> = { en, id, ar, ru, de, ja, es, pt, fr }

function readKey(messages: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, part) => {
    if (!current || typeof current !== 'object') return undefined
    return (current as Record<string, unknown>)[part]
  }, messages)
}

describe('Store shopper Round 2 i18n copy', () => {
  it('localizes newly added shopper strings in every supported locale', () => {

    for (const key of NEW_STORE_KEYS) {
      const english = readKey(en, key)
      expect(typeof english).toBe('string')
      expect(String(english).length).toBeGreaterThan(0)
    }

    for (const locale of locales) {
      if (locale === 'en') continue
      const messages = messagesByLocale[locale]
      for (const key of NEW_STORE_KEYS) {
        const value = readKey(messages, key)
        expect(typeof value).toBe('string')
        expect(String(value).length).toBeGreaterThan(0)
        expect(value).not.toBe(readKey(en, key))
      }
    }
  })
})
