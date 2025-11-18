import { createSchemaRule } from './createSchemaRule'

export const schemaOrganizationRule = createSchemaRule({
  id: 'schema:organization',
  name: 'Schema Organization/LocalBusiness',
  types: ['Organization', 'LocalBusiness'],
  searchStrings: ['Organization', 'LocalBusiness'],
  validator: (n) => !!n['name'] && (!!n['logo'] || !!n['image']) && !!n['url'],
})

