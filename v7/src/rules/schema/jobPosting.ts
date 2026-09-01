import { createSchemaRule } from './createSchemaRule'

export const schemaJobPostingRule = createSchemaRule({
  id: 'schema:jobposting',
  name: 'Schema JobPosting',
  types: 'JobPosting',
  validator: (n) => {
    const missing = ['title', 'datePosted', 'hiringOrganization'].filter((key) => !n[key])
    return { ok: missing.length === 0, missing }
  },
})
