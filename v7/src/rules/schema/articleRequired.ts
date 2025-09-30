import type { Rule } from '@/core/types'
import { parseLd, findType, get, docs } from '@/shared/structured'
import { missingPaths } from '@/shared/schema'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const schemaArticleRequiredRule: Rule = {
  id: 'schema:article:required',
  name: 'Schema Article required fields',
  enabled: true,
  async run(page) {
    const scripts = page.doc.querySelectorAll('script[type="application/ld+json"]')
    const nodes = parseLd(page.doc)
    const items = [...findType(nodes, 'article'), ...findType(nodes, 'newsarticle'), ...findType(nodes, 'blogposting')]
    if (!items.length)
      return { label: 'SCHEMA', message: 'No Article JSON‑LD', type: 'info', name: 'schemaArticleRequired' }
    const n = items[0]
    const req = ['headline']
    const altOk = !!get(n, 'datePublished') || !!get(n, 'dateModified')
    const miss = missingPaths(n, req)
    if (!altOk) miss.push('datePublished|dateModified')
    if (!get(n, 'image')) miss.push('image')
    const author = get(n, 'author')
    const an = typeof author === 'string' ? author : get(author, 'name')
    if (!an) miss.push('author.name')
    const script =
      Array.from(scripts).find((s) => s.textContent?.includes('Article') || s.textContent?.includes('BlogPosting')) || null
    const sourceHtml = extractHtml(script)
    return {
      label: 'SCHEMA',
      message: miss.length
        ? `Article missing: ${miss.join(', ')} · Docs: ${docs('article')}`
        : `Article required OK · Docs: ${docs('article')}`,
      type: miss.length ? 'warn' : 'ok',
      name: 'schemaArticleRequired',
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

