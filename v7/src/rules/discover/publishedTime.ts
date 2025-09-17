import type { Rule } from '@/core/types'

const metaPub = (d: Document) => d.querySelector('meta[property="article:published_time"], meta[name="pubdate"], time[datetime]')?.getAttribute('content') || d.querySelector('time[datetime]')?.getAttribute('datetime') || ''
const ldPub = (d: Document) => {
  const scripts = Array.from(d.querySelectorAll('script[type="application/ld+json"]'))
  for (const s of scripts) {
    try {
      const j = JSON.parse(s.textContent || 'null')
      const arr = Array.isArray(j) ? j : [j]
      for (const it of arr) if (it && typeof it['datePublished'] === 'string') return it['datePublished'] as string
    } catch { /* ignore */ }
  }
  return ''
}

export const discoverPublishedTimeRule: Rule = {
  id: 'discover:published-time',
  name: 'Discover: Published time',
  enabled: true,
  async run(page) {
    const v = metaPub(page.doc) || ldPub(page.doc)
    return v ? { label: 'DISCOVER', message: `Published: ${v}`, type: 'info' } : { label: 'DISCOVER', message: 'Add published time (meta or LD+JSON)', type: 'warn' }
  },
}

