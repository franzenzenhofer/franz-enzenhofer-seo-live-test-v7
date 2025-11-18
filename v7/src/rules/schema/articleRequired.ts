import { createSchemaRule } from './createSchemaRule'

import { get } from '@/shared/structured'
import { missingPaths } from '@/shared/schema'

export const schemaArticleRequiredRule = createSchemaRule({
  id: 'schema:article:required',
  name: 'Schema Article required fields',
  types: ['Article', 'NewsArticle', 'BlogPosting'],
  searchStrings: ['Article', 'BlogPosting'],
  validator: (n) => {
    const req = ['headline']
    const miss = missingPaths(n, req)

    // Check datePublished OR dateModified (either is acceptable)
    const altOk = !!get(n, 'datePublished') || !!get(n, 'dateModified')
    if (!altOk) miss.push('datePublished|dateModified')

    // Check image
    if (!get(n, 'image')) miss.push('image')

    // Check author.name (handle both string and object)
    const author = get(n, 'author')
    const an = typeof author === 'string' ? author : get(author, 'name')
    if (!an) miss.push('author.name')

    return { ok: miss.length === 0, missing: miss }
  },
})

