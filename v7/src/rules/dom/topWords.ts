import type { Rule } from '@/core/types'
import { topWords } from '@/shared/wordFrequency'

export const topWordsRule: Rule = {
  id: 'dom:top-words',
  name: 'Top words',
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'franz',
    references: [],
    description: 'Reports the five most frequent words (>=4 chars, ASCII alphanumeric) in the body text (info-only).',
  },
  async run(page) {
    const topFreq = topWords(page.doc.body)
    if (!topFreq.length) return { label: 'DOM', message: 'No text', type: 'info', priority: 900, name: 'Top words', details: { textLength: 0 } }
    const f = topFreq.map(([w, c]) => `${w}(${c})`).join(', ')

    return {
      label: 'DOM',
      message: `Top words: ${f}`,
      type: 'info',
      priority: 800,
      name: 'Top words',
      details: { topWords: Object.fromEntries(topFreq), textLength: page.idleFacts?.textLength ?? (page.doc.body?.textContent || '').replace(/\s+/g, ' ').trim().length },
    }
  },
}
