import { createSchemaRule } from './createSchemaRule'

export const schemaArticlePresentRule = createSchemaRule({
  id: 'schema:article:present',
  name: 'Schema Article present',
  types: ['Article', 'NewsArticle', 'BlogPosting'],
  searchStrings: ['Article', 'BlogPosting'],
  meta: {
    userGuide: {
      check: "Detects Article, NewsArticle and BlogPosting entities in JSON-LD, a machine-readable description of page content. Presence is optional and does not validate the fields or guarantee search features.",
      action: "For article pages, consider structured data that describes the actual article. Use the field-check result and Google Rich Results Test to validate existing markup.",
    },
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/appearance/structured-data/article'],
    description: 'Checks whether Article/NewsArticle/BlogPosting JSON-LD is present (ok if found, info if absent).',
  },
  presenceOnly: true,
  validator: () => true, // Presence check only
})
