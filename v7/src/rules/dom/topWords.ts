import type { Rule } from '@/core/types'
import { topWords } from '@/shared/wordFrequency'

const SPEC = 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'

export const topWordsRule: Rule = {
  id: 'dom:top-words',
  name: 'Top words',
  enabled: true,
  what: 'static',
  async run(page) {
    const topFreq = topWords(page.doc.body)
    if (!topFreq.length) return { label: 'DOM', message: 'No text', type: 'info', name: 'Top words', details: { textLength: 0, reference: SPEC } }
    const f = topFreq.map(([w, c]) => `${w}(${c})`).join(', ')

    return {
      label: 'DOM',
      message: `Top words: ${f}`,
      type: 'info',
      name: 'Top words',
      details: { topWords: Object.fromEntries(topFreq), textLength: page.idleFacts?.textLength, reference: SPEC },
    }
  },
}
