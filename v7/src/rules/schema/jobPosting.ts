import { createSchemaRule } from './createSchemaRule'

export const schemaJobPostingRule = createSchemaRule({
  id: 'schema:jobposting',
  name: 'Schema JobPosting',
  types: 'JobPosting',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/appearance/structured-data/job-posting'],
    description: 'Warns when a JobPosting node lacks title, datePosted, or hiringOrganization.',
  },
  validator: (n) => {
    // Google's required-properties table: datePosted, description, hiringOrganization, jobLocation, title
    const missing = ['title', 'datePosted', 'description', 'hiringOrganization', 'jobLocation'].filter((key) => !n[key])
    return { ok: missing.length === 0, missing }
  },
})
