import type { Rule } from '@/core/types'
import { topWords } from '@/shared/wordFrequency'
import { CONTENT_TEXT_METHOD, contentRoot, contentSummary } from '@/shared/contentText'
import { recordCounts } from '@/shared/presentation/counts'
import { textField } from '@/shared/presentation/create'
import { clip, listRow } from '@/shared/presentation/listRow'
import { presentResult } from '@/shared/presentation/result'

const DETAIL_VALUE_LIMIT = 120

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
      // The words themselves are the observed value (FORMATTING.md F12); the text length is the measured size.
      values: [textField('Top words', listRow(topFreq.map(([word, count]) => `${word} ${count}`))), textField('Content characters', content.length)],
      detailValues: [textField('Content source', content.source), textField('Excerpt', clip(content.excerpt || 'Empty', DETAIL_VALUE_LIMIT)),
        ...recordCounts({ found: topFreq.length, markup: 0, evidence: topFreq.length })],
      checked: [textField('Content root', 'main, then article, then body (first match)'), textField('Method', CONTENT_TEXT_METHOD),
        textField('Word criterion', 'Unicode letters/digits, at least 4 characters, case-insensitive'),
        textField('Ranking', 'Top 5 by frequency'), textField('Criterion', 'Descriptive report; no pass/fail threshold')],
      evidence: topFreq.map(([word, count], index) => ({
        name: word, fields: [textField('Rank', index + 1), textField('Occurrences', count)],
      })),
      noMarkup: 'Not retained: words are counted in the extracted text, not in element markup',
    })
  },
}
