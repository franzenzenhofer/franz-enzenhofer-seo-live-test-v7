
import type { Rule } from '@/core/types'
import { sampleDelimitedTokens } from '@/shared/boundedTokens'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'
import { listRow, OVERVIEW_VALUE_LIMIT } from '@/shared/presentation/listRow'

const NAME = 'Meta keywords (ignored by Google)'
const RULE_ID = 'head:meta-keywords'
const SELECTOR = 'head > meta[name="keywords" i]'
const OVERVIEW_MARKUP_LIMIT = 3

const checked = [
  textField('Selector', SELECTOR),
  textField('Selection', 'All matching elements'),
  textField('Criterion', 'Google does not use meta keywords metadata for ranking'),
]

// Overview: the keywords the page declares (summary), then the complete <meta name="keywords"> element(s).
export const metaKeywordsRule: Rule = {
  id: RULE_ID, name: NAME, presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/special-tags',
      'https://developers.google.com/search/blog/2009/09/google-does-not-use-keywords-meta-tag',
    ],
    description: 'Flags any meta[name=keywords] tag as unused by Google (warn) and confirms its absence (info).',
  },
  async run(page) {
    const elements = sampleElements(page.doc.querySelectorAll(SELECTOR))
    if (!elements.total) return presentResult(metaKeywordsRule, page, {
      input: 'Idle DOM', type: 'info', priority: 980,
      values: [textField('Meta keywords', 'Not found')], checked,
      noMarkup: 'No meta keywords element found',
    })

    const records = elementRecords(elements.sample, elements.total)
    const overviewMarkup = records.markup.length <= OVERVIEW_MARKUP_LIMIT ? records.markup : []
    if (elements.total > 1) return presentResult(metaKeywordsRule, page, {
      input: 'Idle DOM', type: 'warn', priority: 300,
      values: [textField('Meta keywords tags', elements.total), ...overviewMarkup],
      detailValues: records.counts, checked, evidence: records.evidence, markup: records.markup,
      noMarkup: 'Complete original meta keywords markup not retained',
    })

    const content = (elements.sample[0]!.getAttribute('content') || '').trim()
    const keywords = sampleDelimitedTokens(content)
    return presentResult(metaKeywordsRule, page, {
      input: 'Idle DOM', type: 'warn', priority: 650,
      values: [textField('Keywords', listRow(keywords.values, OVERVIEW_VALUE_LIMIT, keywords.total - keywords.values.length)), ...overviewMarkup],
      detailValues: [textField('Keyword tokens', keywords.total), ...records.counts],
      checked, evidence: records.evidence, markup: records.markup,
      noMarkup: 'Complete original meta keywords markup not retained',
    })
  },
}
