import { renderToStaticMarkup } from 'react-dom/server'
import { EnglishEyewearDecisionFaq, ENGLISH_EYEWEAR_DECISION_FAQS } from '@/components/seo/EnglishEyewearDecisionFaq'
import { generateStructuredData } from '@/lib/seo'

describe('English eyewear decision FAQ', () => {
  const html = renderToStaticMarkup(<EnglishEyewearDecisionFaq />)

  it('has three distinct, visible shopper answers with actionable existing paths', () => {
    expect(ENGLISH_EYEWEAR_DECISION_FAQS).toHaveLength(3)
    expect(html).toContain('Before trying glasses from a product image')
    for (const item of ENGLISH_EYEWEAR_DECISION_FAQS) {
      expect(html).toContain(item.question.replaceAll("'", '&#x27;'))
      expect(html).toContain(item.href)
      expect(html).toContain(item.ctaLabel)
    }
  })

  it('explains screenshots, paid personalization, and physical-fit boundaries', () => {
    expect(html).toContain('you are permitted to use')
    expect(html).toContain('own portrait')
    expect(html).toContain('on-device shape estimate')
    expect(html).toContain('separate personalized recommendation product')
    expect(html).toContain('overall frame-front width')
    expect(html).toContain('Neither printed sizes nor an AI appearance preview proves physical comfort')
  })

  it('uses the exact visible question and answer strings in the existing FAQPage schema', () => {
    const schema = generateStructuredData('faqPage', {
      questions: ENGLISH_EYEWEAR_DECISION_FAQS.map(({ question, answer }) => ({ question, answer })),
    })
    expect(schema['@type']).toBe('FAQPage')
    expect(schema.mainEntity).toHaveLength(3)
    for (const [i, item] of ENGLISH_EYEWEAR_DECISION_FAQS.entries()) {
      expect(schema.mainEntity[i].name).toBe(item.question)
      expect(schema.mainEntity[i].acceptedAnswer.text).toBe(item.answer)
    }
  })
})
