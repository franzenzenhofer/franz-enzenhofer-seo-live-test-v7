import { createSchemaRule } from './createSchemaRule'

export const schemaHowToRule = createSchemaRule({
  id: 'schema:howto',
  name: 'Schema HowTo',
  types: 'HowTo',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/updates#how-to-deprecation'],
    description: 'Warns when a HowTo node lacks name or a step array.',
  },
  deprecated: 'How-to rich results are no longer shown in Google Search (documentation removed Sept 2023).',
  reference: 'https://developers.google.com/search/updates#how-to-deprecation',
  validator: (n) => {
    const missing: string[] = []
    if (!n['name']) missing.push('name')
    if (!Array.isArray(n['step'])) missing.push('step')
    return { ok: missing.length === 0, missing }
  },
})
