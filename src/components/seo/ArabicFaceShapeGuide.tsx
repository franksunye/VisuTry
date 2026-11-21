import Link from '@/components/layout/PublicLink'

// Original schematic outlines illustrate categories; they are not detector results.
const shapes = [
  {
    id: 'round',
    name: 'دائري',
    clue: 'الطول والعرض متقاربان، مع انحناء ناعم عند الفك.',
    outline: 'M50 20C24 20 10 36 10 58C10 82 28 102 50 102C72 102 90 82 90 58C90 36 76 20 50 20Z',
  },
  {
    id: 'oval',
    name: 'بيضاوي',
    clue: 'أطول قليلًا من عرضه، مع فك ناعم يضيق تدريجيًا نحو الذقن.',
    outline: 'M50 9C28 9 15 26 15 49C15 78 32 109 50 112C68 109 85 78 85 49C85 26 72 9 50 9Z',
  },
  {
    id: 'square',
    name: 'مربع',
    clue: 'الجبهة والفك متقاربان في العرض، وزاويتا الفك واضحتان.',
    outline: 'M50 17C29 17 13 24 12 40L12 78Q12 90 23 97Q50 108 77 97Q88 90 88 78L88 40C87 24 71 17 50 17Z',
  },
  {
    id: 'heart',
    name: 'قلبي',
    clue: 'الجبهة أعرض من الفك، والوجه يضيق نحو ذقن أنحف.',
    outline: 'M50 14C25 14 9 26 10 45C12 68 31 95 50 111C69 95 88 68 90 45C91 26 75 14 50 14Z',
  },
  {
    id: 'diamond',
    name: 'ماسي',
    clue: 'عظام الخد هي الأعرض، والجبهة والفك أضيق منها.',
    outline: 'M50 10Q34 10 29 29L10 57Q11 68 25 82L50 111L75 82Q89 68 90 57L71 29Q66 10 50 10Z',
  },
  {
    id: 'oblong',
    name: 'طويل (مستطيل)',
    clue: 'الوجه أطول بوضوح من عرضه، وجانباه أقرب إلى الاستقامة.',
    outline: 'M50 5C31 5 20 15 20 34L20 80C20 99 33 114 50 115C67 114 80 99 80 80L80 34C80 15 69 5 50 5Z',
  },
  {
    id: 'triangle',
    name: 'مثلث',
    clue: 'الفك أعرض من الجبهة، مع اتساع الوجه نحو الأسفل.',
    outline: 'M50 15C33 15 25 25 25 42L12 76Q10 88 23 98Q50 114 77 98Q90 88 88 76L75 42C75 25 67 15 50 15Z',
  },
] as const

export function ArabicFaceShapeGuide() {
  return (
    <section id="arabic-face-shape-guide" className="mt-10 sm:mt-12" aria-labelledby="arabic-face-shape-heading">
      <h2 id="arabic-face-shape-heading" className="text-2xl font-bold leading-relaxed text-gray-950">
        سبعة أشكال للوجه: ما الأقرب إليك؟
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-600">
        انظر إلى صورة أمامية أو مرآة: قارن طول الوجه بعرضه، ثم لاحظ أوسع جزء وشكل الفك.
      </p>

      <ul className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        {shapes.map((shape) => (
          <li key={shape.id} className="flex items-start gap-3 border-t border-gray-200 pt-4">
            <svg viewBox="0 0 100 120" width="44" height="53" className="h-[53px] w-11 shrink-0 text-blue-700" aria-hidden="true" focusable="false">
              <path d={shape.outline} fill="#eff6ff" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" />
            </svg>
            <div className="min-w-0">
              <h3 className="font-semibold leading-6 text-gray-950">{shape.name}</h3>
              <p className="mt-1 text-sm leading-6 text-gray-600">{shape.clue}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-4 rounded-lg bg-blue-50 p-4 sm:grid-cols-2 sm:p-5">
        <div>
          <h3 className="font-semibold leading-7 text-gray-950">دائري أم بيضاوي؟</h3>
          <p className="mt-1 text-sm leading-6 text-gray-700">
            إذا كان الفك ناعمًا، فقارن الطول بالعرض: الدائري أقرب إلى التساوي، والبيضاوي أطول.
          </p>
        </div>
        <div>
          <h3 className="font-semibold leading-7 text-gray-950">قلبي أم ماسي؟</h3>
          <p className="mt-1 text-sm leading-6 text-gray-700">
            ابحث عن أعرض منطقة: غالبًا تكون الجبهة في الشكل القلبي، وعظام الخد في الشكل الماسي.
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-gray-600">
        قد يجمع وجهك ملامح شكلين؛ استخدم الأقرب كدليل لا كتصنيف نهائي. الرسوم مبسطة وليست قياسًا لوجهك.
      </p>
      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold leading-7">
        <Link href="/ar/face-shape-detector" prefetch={false} className="text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900">
          تقدير مجاني لشكل وجهك من صورة
        </Link>
        <Link href="/ar/find-glasses-for-my-face" prefetch={false} className="text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900">
          كيف تختار نظارات تناسب وجهك؟
        </Link>
      </p>
    </section>
  )
}
