import type { Rule } from '@/core/types'
import { topWords } from '@/shared/wordFrequency'
import { contentRoot, contentSummary } from '@/shared/contentText'

export const topWordsRule: Rule = {
  id: 'dom:top-words',
  name: 'Top words',
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: "Lists the five most frequent words of at least four characters in the selected main/article/body text, ignoring case. Counts help identify the captured topic; they are not keyword-density targets or SEO scores.",
      action: "Review the text excerpt to confirm the intended content was captured. Improve unclear or repetitive writing for readers; do not add repetitions to reach a numeric target.",
    },
    provenance: 'franz',
    references: [],
    description: 'Reports frequent Unicode words in main/article/body content, excluding non-content and hidden subtrees (info-only).',
  },
  async run(page) {
    const content = contentSummary(page.doc)
    const topFreq = topWords(contentRoot(page.doc).root)
    if (!topFreq.length) return { label: 'DOM', message: content.length ? 'No qualifying words of at least four characters found' : 'No text found in the inspected content', type: 'info', priority: 900, name: 'Top words', details: { textLength: content.length, contentSource: content.source, excerpt: content.excerpt, method: content.method } }
    const f = topFreq.map(([w, c]) => `${w} (${c} occurrences)`).join(', ')

    return {
      label: 'DOM',
      message: `Top words: ${f}`,
      type: 'info',
      priority: 800,
      name: 'Top words',
      details: { topWords: Object.fromEntries(topFreq), textLength: content.length, contentSource: content.source, excerpt: content.excerpt, method: content.method },
    }
  },
}
