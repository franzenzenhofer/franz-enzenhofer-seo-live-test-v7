import { createSchemaRule } from './createSchemaRule'

const isLocalBusiness = (n: Record<string, unknown>) => {
  const raw = n['@type']
  const types = Array.isArray(raw) ? raw : raw ? [raw] : []
  return types.some((t) => String(t).toLowerCase().includes('localbusiness'))
}

export const schemaOrganizationRule = createSchemaRule({
  id: 'schema:organization',
  name: 'Schema Organization/LocalBusiness',
  types: ['Organization', 'LocalBusiness'],
  searchStrings: ['Organization', 'LocalBusiness'],
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/appearance/structured-data/organization',
      'https://developers.google.com/search/docs/appearance/structured-data/local-business',
    ],
    description: 'Warns when an Organization/LocalBusiness node lacks name, logo|image, or url.',
  },
  validator: (n) => {
    if (isLocalBusiness(n)) {
      // Google's LocalBusiness required-properties table: name and address
      const missing = ['name', 'address'].filter((key) => !n[key])
      return { ok: missing.length === 0, missing }
    }
    // Google's Organization doc: 'There are no required properties' - name/logo/url are recommended
    const missing: string[] = []
    if (!n['name']) missing.push('name')
    if (!n['logo'] && !n['image']) missing.push('logo|image')
    if (!n['url']) missing.push('url')
    return { ok: missing.length === 0, missing, failType: 'info', fieldsLabel: 'recommended' }
  },
})
