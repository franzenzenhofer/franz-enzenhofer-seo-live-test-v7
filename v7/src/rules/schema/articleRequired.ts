import type { Rule } from '@/core/types'
import { parseLd, findType, get, docs } from '@/shared/structured'
import { missingPaths } from '@/shared/schema'

export const schemaArticleRequiredRule: Rule = {
  id: 'schema:article:required',
  name: 'Schema Article required fields',
  enabled: true,
  async run(page) {
    const nodes = parseLd(page.doc)
    const items = [...findType(nodes, 'article'), ...findType(nodes, 'newsarticle'), ...findType(nodes, 'blogposting')]
    if (!items.length) return { label: 'SCHEMA', message: 'No Article JSON‑LD', type: 'info' }
    const n = items[0]
    const req = ['headline']
    const altOk = !!get(n, 'datePublished') || !!get(n, 'dateModified')
    const miss = missingPaths(n, req)
    if (!altOk) miss.push('datePublished|dateModified')
    if (!get(n, 'image')) miss.push('image')
    const author = get(n, 'author'); const an = typeof author === 'string' ? author : get(author, 'name')
    if (!an) miss.push('author.name')
    return miss.length
      ? { label: 'SCHEMA', message: `Article missing: ${miss.join(', ')} · Docs: ${docs('article')}`, type: 'warn' }
      : { label: 'SCHEMA', message: `Article required OK · Docs: ${docs('article')}`, type: 'ok' }
  },
}

