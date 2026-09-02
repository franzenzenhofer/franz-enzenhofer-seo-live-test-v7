import { createSchemaRule } from './createSchemaRule'

export const schemaBreadcrumbRule = createSchemaRule({
  id: 'schema:breadcrumb',
  name: 'Schema BreadcrumbList',
  types: 'BreadcrumbList',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/appearance/structured-data/breadcrumb'],
    description: 'Checks that a BreadcrumbList node has an itemListElement array with at least 2 entries.',
  },
  validator: (n) => {
    const els = (n['itemListElement'] as unknown[]) || []
    return els.length >= 2
      ? { ok: true }
      : { ok: false, missing: [`itemListElement needs >=2 entries (found ${els.length})`] }
  },
})
