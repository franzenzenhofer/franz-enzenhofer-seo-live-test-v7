import { createSchemaRule } from './createSchemaRule'

export const schemaBreadcrumbRule = createSchemaRule({
  id: 'schema:breadcrumb',
  name: 'Schema BreadcrumbList',
  types: 'BreadcrumbList',
  validator: (n) => {
    const els = (n['itemListElement'] as unknown[]) || []
    return els.length >= 2
  },
})

