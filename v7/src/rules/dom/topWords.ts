import type { Rule } from '@/core/types'

const text = (d: Document) =>
  (d.body?.innerText || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()

const freq = (s: string) => {
  const m = new Map<string, number>()
  for (const w of s.split(' ')) if (w.length >= 4) m.set(w, (m.get(w) || 0) + 1)
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
}

export const topWordsRule: Rule = {
  id: 'dom:top-words',
  name: 'Top words',
  enabled: true,
  what: 'static',
  async run(page) {
    const t = text(page.doc)
    if (!t) return { label: 'DOM', message: 'No text', type: 'info', name: 'topWords' }

    const topFreq = freq(t)
    const f = topFreq.map(([w, c]) => `${w}(${c})`).join(', ')

    return {
      label: 'DOM',
      message: `Top words: ${f}`,
      type: 'info',
      name: 'topWords',
      details: { topWords: Object.fromEntries(topFreq) },
    }
  },
}

