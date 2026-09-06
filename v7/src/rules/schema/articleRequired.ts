import { createSchemaRule } from './createSchemaRule'

import { get } from '@/shared/structured'
import { missingPaths } from '@/shared/schema'

export const schemaArticleRequiredRule = createSchemaRule({
  id: 'schema:article:required',
  name: 'Schema Article required fields',
  types: ['Article', 'NewsArticle', 'BlogPosting'],
  searchStrings: ['Article', 'BlogPosting'],
  fieldsLabel: 'recommended', // Google: 'There are no required properties' - everything checked here is recommended
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/appearance/structured-data/article'],
    description: 'Warns when an Article/NewsArticle/BlogPosting node lacks headline, image, author.name, or datePublished/dateModified.',
  },
  validator: (n) => {
    const miss = missingPaths(n, ['headline'])

    // Google lists datePublished and dateModified as two separate recommended properties
    if (!get(n, 'datePublished')) miss.push('datePublished')
    if (!get(n, 'dateModified')) miss.push('dateModified')

    // Check image
    const images = get(n, 'image')
    if (!images || (Array.isArray(images) && images.length === 0)) miss.push('image')

    // Check author.name (handle both string and object)
    const author = get(n, 'author')
    const authors = Array.isArray(author) ? author : [author]
    if (!authors.length || authors.some((item) => !String(typeof item === 'string' ? item : get(item, 'name') || '').trim())) miss.push('author.name')

    return { ok: miss.length === 0, missing: miss }
  },
})
