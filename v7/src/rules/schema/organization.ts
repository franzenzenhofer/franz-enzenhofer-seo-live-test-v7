import { createSchemaRule } from './createSchemaRule'

export const schemaOrganizationRule = createSchemaRule({
  id: 'schema:organization',
  name: 'Schema Organization/LocalBusiness',
  types: ['Organization', 'LocalBusiness'],
  searchStrings: ['Organization', 'LocalBusiness'],
  validator: (n) => {
    const missing: string[] = []
    if (!n['name']) missing.push('name')
    if (!n['logo'] && !n['image']) missing.push('logo|image')
    if (!n['url']) missing.push('url')
    return { ok: missing.length === 0, missing }
  },
})

