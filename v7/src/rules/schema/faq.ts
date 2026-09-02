import { createSchemaRule } from './createSchemaRule'

const isQuestionWithAnswer = (value: unknown) => {
  if (!value || typeof value !== 'object') return false
  const q = value as Record<string, unknown>
  return String(q['@type'] || '').toLowerCase().includes('question') && !!q['acceptedAnswer']
}

export const schemaFaqRule = createSchemaRule({
  id: 'schema:faq',
  name: 'Schema FAQPage',
  types: 'FAQPage',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/updates#removing-faq-rich-result'],
    description: 'Warns when a FAQPage node lacks a mainEntity Question with an acceptedAnswer.',
  },
  deprecated: 'Google retired the FAQ rich result (restricted to government/health sites Aug 2023, documentation removed 2025).',
  reference: 'https://developers.google.com/search/blog/2023/08/howto-faq-changes',
  validator: (n) => {
    const raw = n['mainEntity']
    // mainEntity need not be an array in valid JSON-LD - normalize before iterating
    const ents = Array.isArray(raw) ? raw : raw ? [raw] : []
    const ok = ents.some(isQuestionWithAnswer)
    return ok ? { ok } : { ok, missing: ['mainEntity Question with acceptedAnswer'] }
  },
})
