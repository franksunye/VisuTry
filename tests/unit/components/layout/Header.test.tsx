import React from 'react'
import { render, screen } from '@testing-library/react'
import { Header } from '@/components/layout/Header'

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'user-1' } }, status: 'authenticated' }),
}))

jest.mock('next/navigation', () => ({
  usePathname: () => '/en/dashboard',
  useParams: () => ({ locale: 'en' }),
}))

jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => {
    const labels: Record<string, string> = {
      'nav.detectorShort': 'Detector',
      'nav.advisorShort': 'Advisor',
      'nav.tryOnShort': 'Try On',
      'nav.explorerShort': 'Explorer',
      'nav.compareShort': 'Compare',
      'nav.discover': 'Discover',
      'nav.forBusiness': 'For Business',
      'nav.shopperJourney': 'Shopper journey',
      'nav.businessJourney': 'For brands & retailers',
      'nav.faceAnalysis': 'Glasses Advisor',
      'nav.toggleMenu': 'Toggle navigation menu',
      'common.checkFaceShape': 'Check face shape',
    }
    const translate = (key: string) => labels[`${namespace}.${key}`] ?? key
    translate.has = (key: string) => Boolean(labels[`${namespace}.${key}`])
    return translate
  },
}))

jest.mock('@/hooks/useTestSession', () => ({
  useTestSession: () => ({ testSession: null }),
}))
jest.mock('@/components/auth/LoginButton', () => ({ LoginButton: () => null }))
jest.mock('@/components/auth/UserMenu', () => ({ UserMenu: () => <div>User menu</div> }))
jest.mock('@/components/LanguageSwitcher', () => ({ LanguageSwitcher: () => <div>Language</div> }))

describe('Header decision journey', () => {
  it('sends authenticated primary CTAs to Glasses Advisor while keeping Try On optional', () => {
    render(<Header />)

    const advisorCtas = screen.getAllByRole('link', { name: 'Glasses Advisor' })
    expect(advisorCtas).toHaveLength(2)
    advisorCtas.forEach((link) => expect(link).toHaveAttribute('href', '/en/face-analysis'))

    expect(screen.getAllByRole('link', { name: 'Try On' })[0]).toHaveAttribute(
      'href',
      '/en/try-on/glasses',
    )

    expect(screen.getAllByRole('link', { name: 'For Business' })[0]).toHaveAttribute(
      'href',
      '/en/business',
    )
    expect(screen.queryAllByRole('link', { name: 'Detector' })).toHaveLength(0)
  })
})
