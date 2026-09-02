import { createSchemaRule } from './createSchemaRule'

export const schemaArticlePresentRule = createSchemaRule({
  id: 'schema:article:present',
  name: 'Schema Article present',
  types: ['Article', 'NewsArticle', 'BlogPosting'],
  searchStrings: ['Article', 'BlogPosting'],
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/appearance/structured-data/article'],
    description: 'Checks whether Article/NewsArticle/BlogPosting JSON-LD is present (ok if found, info if absent).',
  },
  validator: () => true, // Presence check only
})
