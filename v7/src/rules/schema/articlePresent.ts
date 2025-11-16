import type { Rule } from '@/core/types'
import { parseLd, findType, docs } from '@/shared/structured'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const schemaArticlePresentRule: Rule = {
  id: 'schema:article:present',
  name: 'Schema Article present',
  enabled: true,
  what: 'static',
  async run(page) {
    const scripts = page.doc.querySelectorAll('script[type="application/ld+json"]')
    const nodes = parseLd(page.doc)
    const items = [...findType(nodes, 'article'), ...findType(nodes, 'newsarticle'), ...findType(nodes, 'blogposting')]
    if (!items.length)
      return { label: 'SCHEMA', message: 'No Article/NewsArticle JSON‑LD', type: 'info', name: 'schemaArticlePresent' }
    const script =
      Array.from(scripts).find((s) => s.textContent?.includes('Article') || s.textContent?.includes('BlogPosting')) || null
    const sourceHtml = extractHtml(script)
    return {
      label: 'SCHEMA',
      message: `Article JSON‑LD found · Docs: ${docs('article')}`,
      type: 'ok',
      name: 'Schema Article present',
      details: script
        ? {
            sourceHtml,
            snippet: extractSnippet(sourceHtml),
            domPath: getDomPath(script),
          }
        : undefined,
    }
  },
}

