import { createSchemaRule } from './createSchemaRule'

export const schemaArticlePresentRule = createSchemaRule({
  id: 'schema:article:present',
  name: 'Schema Article present',
  types: ['Article', 'NewsArticle', 'BlogPosting'],
  searchStrings: ['Article', 'BlogPosting'],
  validator: () => true, // Presence check only
})

