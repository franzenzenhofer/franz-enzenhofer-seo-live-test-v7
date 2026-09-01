import { createSchemaRule } from './createSchemaRule'

export const schemaFaqRule = createSchemaRule({
  id: 'schema:faq',
  name: 'Schema FAQPage',
  types: 'FAQPage',
  validator: (n) => {
    const ents = (n['mainEntity'] as Array<Record<string, unknown>>) || []
    const ok = (ents || []).some((q) => q && String(q['@type'] || '').toLowerCase().includes('question') && !!q['acceptedAnswer'])
    return ok ? { ok } : { ok, missing: ['mainEntity Question with acceptedAnswer'] }
  },
})
