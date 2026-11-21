import Link from '@/components/layout/PublicLink'
import { StaticContentImage } from '@/components/seo/StaticContentImage'
import { B03_VISUAL_SEO_ASSETS } from '@/config/visual-seo-assets'

const comparisonImage = B03_VISUAL_SEO_ASSETS.find((asset) => asset.id === 'VSEO-020')!

/** A short Arabic editorial comparison, independent of personalized reports. */
export function ArabicGlassesSelectionExample() {
  return (
    <section id="frame-selection-example" aria-labelledby="frame-selection-example-title" className="mt-12 scroll-mt-8 space-y-6">
      <div className="max-w-3xl">
        <h2 id="frame-selection-example-title" className="text-2xl font-bold leading-relaxed text-gray-950 md:text-3xl">
          قارن إطارين على الوجه نفسه
        </h2>
        <p className="mt-3 text-base leading-8 text-gray-700">
          بعد معرفة شكل وجهك، ابدأ بإطارين مختلفين لترى أي مظهر تفضّل. في هذا المثال يتغيّر شكل الإطار ولونه معًا، لذلك لاحظ الحافة العليا والزوايا ووضوح الحواف، لا اسم الشكل وحده.
        </p>
      </div>

      <figure className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-gray-200 bg-white p-3 sm:p-5">
        {/* Focus on the two faces without the source artwork's English labels.
            Keep the original immutable asset and its left/right orientation. */}
        <div className="overflow-hidden rounded-lg" style={{ aspectRatio: '1448 / 560' }}>
          <StaticContentImage
            src={comparisonImage.publicPath}
            alt="الوجه نفسه بإطار داكن شبه مستطيل يسار الصورة وإطار فاتح أكثر استدارة يمينها، مع التركيز على منطقة العينين"
            width={comparisonImage.width}
            height={comparisonImage.height}
            sizes="(max-width: 768px) 100vw, 896px"
            className="h-full w-full object-cover"
            style={{ objectPosition: 'center 32.32%' }}
          />
        </div>
        <figcaption className="mt-3 text-sm leading-7 text-gray-600">
          مثال توضيحي للمقارنة على الوجه نفسه، وليس نتيجة تحليل شخصي أو تجربة مستخدم.
        </figcaption>
      </figure>

      <div dir="ltr" className="grid gap-4 md:grid-cols-2">
        <article dir="rtl" className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="font-semibold text-gray-950">الإطار الداكن — يسار الصورة</h3>
          <p className="mt-2 text-sm leading-7 text-gray-700">
            حافته العليا أوضح وزواياه شبه مربعة مع انحناء ناعم. اللون الداكن يجعل سُمك الحواف أكثر بروزًا حول العينين.
          </p>
        </article>
        <article dir="rtl" className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="font-semibold text-gray-950">الإطار الفاتح — يمين الصورة</h3>
          <p className="mt-2 text-sm leading-7 text-gray-700">
            حافته العليا أكثر انحناءً وزواياه أكثر استدارة. اللون الفاتح يجعل الحواف أقل بروزًا، فيبدو الإطار أخف بصريًا.
          </p>
        </article>
      </div>

      <div className="max-w-3xl space-y-3">
        <h3 className="text-lg font-semibold text-gray-950">خطوتان لمقارنة خياراتك</h3>
        <ol className="list-inside list-decimal space-y-2 text-sm leading-7 text-gray-700">
          <li>استخدم صورة الوجه نفسها وبالتكبير نفسه لكل إطار، حتى لا يتغيّر انطباعك بسبب زاوية التصوير.</li>
          <li>قارن الحافة العليا بالحاجبين، ثم انظر إلى الزوايا وسُمك الحواف: هل تفضّل حدودًا واضحة أم مظهرًا أخف؟</li>
        </ol>
        <p className="text-sm leading-7 text-gray-600">
          الصورة تساعدك على اختيار المظهر، لكنها لا تثبت المقاس أو الراحة. قارن عرض الإطار بمقاس نظارة مريحة لديك، وتحقق من الجسر والذراعين عند التجربة الفعلية.
        </p>
      </div>

      <nav aria-label="أدلة تساعدك على اختيار النظارات" className="flex flex-col gap-3 text-sm leading-7 sm:flex-row sm:flex-wrap sm:gap-x-6">
        <Link href="/ar/what-is-my-face-shape" className="font-medium text-blue-700 underline decoration-blue-200 underline-offset-4 hover:decoration-blue-700">
          كيف أعرف شكل وجهي؟
        </Link>
        <Link href="/ar/blog/ai-face-analysis-for-glasses-guide" className="font-medium text-blue-700 underline decoration-blue-200 underline-offset-4 hover:decoration-blue-700">
          دليل اختيار النظارات حسب الوجه
        </Link>
        <Link href="/ar/try-glasses-on-photo" className="font-medium text-blue-700 underline decoration-blue-200 underline-offset-4 hover:decoration-blue-700">
          كيف أجرّب صورة إطار أختاره على صورتي؟
        </Link>
      </nav>
    </section>
  )
}
