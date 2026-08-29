import { Check, KeyRound, ShieldCheck, Sparkles } from "lucide-react"
import { MerchantAuthActions } from '@/components/auth/MerchantAuthActions'
import { ShopperAuthActions } from '@/components/auth/ShopperAuthActions'
import { Metadata } from 'next'
import { generateI18nSEO } from '@/lib/seo'
import { Locale } from '@/i18n'
import { localizedPath } from '@/lib/localized-path'
import { getSafeMerchantAuthCallbackUrl, getSafeShopperAuthCallbackUrl } from '@/lib/commerce-handoff/merchant-continuation'

type Props = {
  params: Promise<{ locale: string }>
  searchParams?: Promise<{ callbackUrl?: string | string[] }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  // For auth pages, we can use a simple static title/description
  // or add translations if needed
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: 'Merchant Sign In | VisuTry',
    description: 'Create or sign in to your VisuTry merchant workspace and connect it to your AI agent.',
    pathname: '/auth/signin',
    noIndex: true,
  })
}

export const dynamic = 'force-dynamic'

export default async function SignInPage(props: Props) {
  const params = await props.params
  const searchParams = props.searchParams ? await props.searchParams : undefined
  const merchantCallback = `/${params.locale}/merchant`
  const rawCallbackUrl = Array.isArray(searchParams?.callbackUrl)
    ? searchParams.callbackUrl[0]
    : searchParams?.callbackUrl
  const shopperCallback = getSafeShopperAuthCallbackUrl(rawCallbackUrl, params.locale)
  const merchantPurchaseCallback = getSafeMerchantAuthCallbackUrl(rawCallbackUrl, params.locale)
  const callbackUrl = shopperCallback || merchantPurchaseCallback || merchantCallback
  const isShopperContinuation = Boolean(shopperCallback)

  return (
    <main data-auth-surface={isShopperContinuation ? 'shopper' : 'merchant-admin'} className="min-h-screen bg-[#f7f8fb] px-4 py-10 text-slate-950 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="bg-[radial-gradient(circle_at_80%_0%,rgba(191,219,254,0.5),transparent_40%),linear-gradient(145deg,#f8fbff,#eef6ff)] p-7 sm:p-10 lg:p-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white"><Sparkles className="h-6 w-6" aria-hidden="true" /></div>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">{isShopperContinuation ? 'VisuTry shopper access' : 'VisuTry for merchants'}</p>
          <h1 className="mt-3 max-w-lg text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">{isShopperContinuation ? 'Continue your shopping experience.' : 'Connect your store to the AI agent you already use.'}</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">{isShopperContinuation ? 'Sign in to continue with your VisuTry Consumer entitlement and return to the same Store or Campaign.' : 'Create a merchant workspace, copy the Key + Skill setup, and paste it into ChatGPT, Claude, or another agent. Your agent will guide the rest.'}</p>
          <div className="mt-8 space-y-4 text-sm text-slate-700">
            {['One merchant workspace for your brand', 'A secure Agent Key you control', 'A guided setup inside your agent conversation'].map((item) => <div key={item} className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm"><Check className="h-4 w-4" aria-hidden="true" /></span>{item}</div>)}
          </div>
        </section>
        <section className="p-7 sm:p-10 lg:p-12">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400"><ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" /> {isShopperContinuation ? 'Secure shopper access' : 'Secure merchant access'}</div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">{isShopperContinuation ? 'Continue to your Store' : 'Start your merchant setup'}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{isShopperContinuation ? 'Your sign-in will return you to the Store or Campaign that started this journey.' : 'Use a work email for your brand. New accounts go straight to Merchant setup; existing VisuTry accounts can sign in and choose a workspace.'}</p>
          <div className="mt-8">{isShopperContinuation ? <ShopperAuthActions callbackUrl={callbackUrl} /> : <MerchantAuthActions callbackUrl={callbackUrl} />}</div>
          <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/60 p-4"><div className="flex items-start gap-3"><KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" /><p className="text-sm leading-6 text-slate-700"><span className="font-semibold text-slate-900">{isShopperContinuation ? 'What happens next?' : 'What happens next?'}</span><br />{isShopperContinuation ? 'After sign-in, your Store or Campaign context remains available for the next step.' : 'Create your key; VisuTry copies the Key + Skill setup, ready to paste into your agent chat.'}</p></div></div>
          <p className="mt-8 text-center text-xs leading-5 text-slate-500">By continuing, you agree to our <a href={localizedPath(params.locale, '/terms')} className="text-blue-700 hover:underline">Terms</a> and <a href={localizedPath(params.locale, '/privacy')} className="text-blue-700 hover:underline">Privacy Policy</a>.</p>
        </section>
      </div>
      <p className="mx-auto mt-5 max-w-5xl text-center text-xs text-slate-500">{isShopperContinuation ? <>Need a merchant workspace? <a href={localizedPath(params.locale, '/merchant')} className="text-blue-700 hover:underline">Use merchant access</a>.</> : <>This is the merchant workspace. For virtual try-on, use the <a href={localizedPath(params.locale, '/try-on')} className="text-blue-700 hover:underline">shopper experience</a>.</>}</p>
    </main>
  )
}
