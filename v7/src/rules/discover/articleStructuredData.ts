import type { Rule } from '@/core/types'

const hasArticle = (doc: Document) => {
  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
  for (const s of scripts) {
    try {
      const j = JSON.parse(s.textContent || 'null')
      const arr = Array.isArray(j) ? j : [j]
      for (const it of arr) {
        const t = (it && (it['@type'] || '')).toString().toLowerCase()
        if (t.includes('article') || t.includes('newsarticle')) return true
      }
    } catch { /* ignore */ }
  }
  return false
}

export const discoverArticleStructuredDataRule: Rule = {
  id: 'discover:article-structured-data',
  name: 'Discover: Article structured data',
  enabled: true,
  async run(page) {
    return hasArticle(page.doc)
      ? { label: 'DISCOVER', message: 'Article/NewsArticle structured data present', type: 'ok' }
      : { label: 'DISCOVER', message: 'Add Article structured data', type: 'warn' }
  },
}

