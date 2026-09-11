import type { Rule } from '@/core/types'
import { topWords } from '@/shared/wordFrequency'
import { contentRoot, contentSummary } from '@/shared/contentText'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'

export const topWordsRule: Rule = {
  id: 'dom:top-words',
  name: 'Top words',
  presentation: 1,
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
    return presentResult(topWordsRule, page, {
      input: 'Idle DOM', type: 'info', priority: topFreq.length ? 800 : 900,
      values: [textField('Content text length', content.length), textField('Top words identified', topFreq.length)],
      detailValues: [textField('Content source', content.source),
        textField('Content excerpt (first 160 characters)', content.excerpt || 'Empty'), textField('Extraction method', content.method)],
      checked: [textField('Content root', 'main, then article, then body (first match)'),
        textField('Word criterion', 'Unicode letters/digits, at least 4 characters, case-insensitive'),
        textField('Ranking', 'Top 5 by frequency'), textField('Criterion', 'Descriptive report; no pass/fail threshold')],
      evidence: topFreq.map(([word, count], index) => ({
        name: `Word ${index + 1}`, fields: [textField('Rank', index + 1), textField('Word', word), textField('Occurrences', count)],
      })),
      noMarkup: 'None - this rule analyzes extracted text content, not individual element markup',
    })
  },
}
