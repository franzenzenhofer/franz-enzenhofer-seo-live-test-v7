import type { Rule } from '@/core/types'

const metaAuthor = (d: Document) => (d.querySelector('meta[name="author"]')?.getAttribute('content') || '').trim()
const ldAuthor = (d: Document) => {
  const scripts = Array.from(d.querySelectorAll('script[type="application/ld+json"]'))
  for (const s of scripts) {
    try {
      const j = JSON.parse(s.textContent || 'null')
      const arr = Array.isArray(j) ? j : [j]
      for (const it of arr) {
        const a = it && it['author']
        const n = typeof a === 'string' ? a : (a && typeof a['name'] === 'string' ? a['name'] : '')
        if (n) return String(n)
      }
    } catch { /* ignore */ }
  }
  return ''
}

export const discoverAuthorPresentRule: Rule = {
  id: 'discover:author',
  name: 'Discover: Author present',
  enabled: true,
  async run(page) {
    const n = metaAuthor(page.doc) || ldAuthor(page.doc)
    return n ? { label: 'DISCOVER', message: `Author: ${n}`, type: 'info' } : { label: 'DISCOVER', message: 'Add author (meta or LD+JSON)', type: 'warn' }
  },
}

