import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

const findArticle = (doc: Document) => {
  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
  const articleScripts: Element[] = []

  for (const s of scripts) {
    try {
      const j = JSON.parse(s.textContent || 'null')
      const arr = Array.isArray(j) ? j : [j]
      for (const it of arr) {
        const t = (it && (it['@type'] || '')).toString().toLowerCase()
        if (t.includes('article') || t.includes('newsarticle')) {
          articleScripts.push(s)
          break
        }
      }
    } catch {
      /* ignore */
    }
  }
  return { found: articleScripts.length > 0, scripts: articleScripts }
}

export const discoverArticleStructuredDataRule: Rule = {
  id: 'discover:article-structured-data',
  name: 'Discover: Article structured data',
  enabled: true,
  async run(page) {
    const result = findArticle(page.doc)
    const sourceHtml = extractHtmlFromList(result.scripts)

    return result.found
      ? {
          label: 'DISCOVER',
          message: 'Article/NewsArticle structured data present',
          type: 'ok',
          name: 'articleStructuredData',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml) },
        }
      : {
          label: 'DISCOVER',
          message: 'Add Article structured data',
          type: 'warn',
          name: 'articleStructuredData',
        }
  },
}

