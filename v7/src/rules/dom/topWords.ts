import type { Rule } from '@/core/types'
import { topWords } from '@/shared/wordFrequency'
import { contentRoot, contentSummary } from '@/shared/contentText'

export const topWordsRule: Rule = {
  id: 'dom:top-words',
  name: 'Top words',
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'franz',
    references: [],
    description: 'Reports frequent Unicode words in main/article/body content, excluding non-content and hidden subtrees (info-only).',
  },
  async run(page) {
    const content = contentSummary(page.doc)
    const topFreq = topWords(contentRoot(page.doc).root)
    if (!topFreq.length) return { label: 'DOM', message: 'No text', type: 'info', priority: 900, name: 'Top words', details: { textLength: 0 } }
    const f = topFreq.map(([w, c]) => `${w}(${c})`).join(', ')

    return {
      label: 'DOM',
      message: `Top words: ${f}`,
      type: 'info',
      priority: 800,
      name: 'Top words',
      details: { topWords: Object.fromEntries(topFreq), textLength: content.length, ...content },
    }
  },
}
