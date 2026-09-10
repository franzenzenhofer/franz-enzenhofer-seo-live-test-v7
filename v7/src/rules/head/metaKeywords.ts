import type { Rule } from '@/core/types'
import { sampleDelimitedTokens } from '@/shared/boundedTokens'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'Meta keywords (ignored by Google)'
const RULE_ID = 'head:meta-keywords'
const SELECTOR = 'head > meta[name="keywords" i]'

const checked = [
  textField('Selector', SELECTOR),
  textField('Selection', 'All matching elements'),
  textField('Criterion', 'Google does not use meta keywords metadata for ranking'),
]

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
      values: [textField('Meta keywords tags', 0), textField('Google ranking use', 'Not used')], checked,
      noMarkup: 'No meta keywords element found',
    })

    const captured = markupEvidence(elements.sample, 'Meta keywords')
    const evidence = [{ name: 'Capture', fields: [
      textField('Elements retained', elements.shown), textField('Elements omitted', elements.total - elements.shown), ...captured.fields,
    ] }]
    if (elements.total > 1) return presentResult(metaKeywordsRule, page, {
      input: 'Idle DOM', type: 'warn', priority: 300,
      values: [textField('Meta keywords tags', elements.total), textField('Google ranking use', 'Not used')],
      checked, evidence, markup: captured.markup,
      noMarkup: 'Complete original meta keywords markup not retained',
    })

    const element = elements.sample[0]!
    const content = (element.getAttribute('content') || '').trim()
    const keywords = sampleDelimitedTokens(content)
    return presentResult(metaKeywordsRule, page, {
      input: 'Idle DOM', type: 'warn', priority: 650,
      values: [textField('Meta keywords tags', 1), textField('Keyword tokens', keywords.total), textField('Google ranking use', 'Not used'), ...captured.markup],
      detailValues: [textField('Content (trimmed)', content || 'Empty'),
        textField('Keyword samples (trimmed)', keywords.values.join(', ') || 'None'),
        textField('Keyword tokens shown', keywords.shown), textField('Keyword tokens omitted', keywords.total - keywords.shown)],
      checked, evidence, markup: captured.markup,
      noMarkup: 'Complete original meta keywords markup not retained',
    })
  },
}
