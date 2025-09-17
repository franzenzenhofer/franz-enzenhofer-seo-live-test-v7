import type { Rule } from '@/core/types'
import { parseLd, findType, docs } from '@/shared/structured'

export const schemaArticlePresentRule: Rule = {
  id: 'schema:article:present',
  name: 'Schema Article present',
  enabled: true,
  async run(page) {
    const nodes = parseLd(page.doc)
    const items = [...findType(nodes, 'article'), ...findType(nodes, 'newsarticle'), ...findType(nodes, 'blogposting')]
    return items.length
      ? { label: 'SCHEMA', message: `Article JSON‑LD found · Docs: ${docs('article')}`, type: 'ok' }
      : { label: 'SCHEMA', message: 'No Article/NewsArticle JSON‑LD', type: 'info' }
  },
}

