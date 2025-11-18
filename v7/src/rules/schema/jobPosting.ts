import { createSchemaRule } from './createSchemaRule'

export const schemaJobPostingRule = createSchemaRule({
  id: 'schema:jobposting',
  name: 'Schema JobPosting',
  types: 'JobPosting',
  validator: (n) => !!n['title'] && !!n['datePosted'] && !!n['hiringOrganization'],
})
