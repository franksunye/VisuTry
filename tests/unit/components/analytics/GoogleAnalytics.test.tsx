import { render } from '@testing-library/react'
import type { ScriptProps } from 'next/script'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'

// Inspect the actual inline bootstrap without loading the Google tag or emitting a hit.
jest.mock('next/script', () => ({
  __esModule: true,
  default: ({ id, dangerouslySetInnerHTML }: ScriptProps) =>
    id ? <script id={id} dangerouslySetInnerHTML={dangerouslySetInnerHTML} /> : null,
}))

it('configures GA once without fixing the title or URL to the landing page', () => {
  const { container } = render(<GoogleAnalytics gaId="G-LOCALTEST" locale="en" />)
  const script = container.querySelector('#google-analytics')
  expect(script).not.toBeNull()

  const commands: IArguments[] = []
  const localWindow = { dataLayer: commands, location: { href: 'https://example.test/guide' } }
  const localDocument = { title: 'Guide', documentElement: { lang: 'en' } }
  const runInline = new Function('window', 'dataLayer', 'document', 'navigator', script!.textContent!)
  runInline(localWindow, commands, localDocument, { language: 'en', languages: ['en'] })

  const calls = commands.map(command => Array.from(command))
  expect(calls.filter(([name]) => name === 'config')).toEqual([['config', 'G-LOCALTEST']])
  expect(calls.some(([name, event]) => name === 'event' && event === 'page_view')).toBe(false)
  expect(calls).toContainEqual(['set', 'user_properties', expect.objectContaining({ site_locale: 'en' })])
})
