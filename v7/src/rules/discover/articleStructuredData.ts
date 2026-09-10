import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { findType, parseLdDetails } from '@/shared/structured'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const TYPES = ['Article', 'NewsArticle', 'BlogPosting']
const SELECTOR = 'script[type="application/ld+json"]'
export const discoverArticleStructuredDataRule: Rule = {
  id: 'discover:article-structured-data', name: 'Article structured data', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/appearance/structured-data/article',
      'https://developers.google.com/search/docs/appearance/google-discover',
    ],
    description: 'Reports Article, NewsArticle and BlogPosting types in parsed JSON-LD.',
  },
  async run(page) {
    const parsed = parseLdDetails(page.doc)
    const matches = parsed.entries.filter(({ node }) => TYPES.some((type) => findType([node], type).length))
    const foundTypes = TYPES.filter((type) => matches.some(({ node }) => findType([node], type).length))
    const { sample, total } = sampleElements(page.doc.querySelectorAll(SELECTOR))
    const captured = markupEvidence(sample, 'JSON-LD script')
    return presentResult(discoverArticleStructuredDataRule, page, {
      input: 'Idle DOM', type: parsed.errorCount ? 'warn' : matches.length ? 'ok' : 'info', priority: parsed.errorCount ? 300 : 800,
      values: [textField('Article entities', matches.length), textField('JSON-LD parse errors', parsed.errorCount)],
      detailValues: [textField('Scripts checked', parsed.scriptCount), textField('Article types found', foundTypes.join(', ') || 'None'),
        textField('Matching script numbers', [...new Set(matches.map(({ scriptIndex }) => scriptIndex + 1))].join(', ') || 'None')],
      checked: [textField('Selector', SELECTOR), textField('Types checked', TYPES.join(', ')),
        textField('Criterion', 'Presence of a matching type in parsed JSON-LD entities'), textField('Entity fields', 'Not validated')],
      evidence: [
        ...parsed.errors.map(({ scriptIndex, message }) => ({ name: `JSON-LD script ${scriptIndex + 1}`, fields: [
          textField('Script number', scriptIndex + 1), textField('Parse error excerpt', message),
        ] })),
        { name: 'Capture', fields: [textField('Scripts retained', sample.length), textField('Scripts omitted', total - sample.length),
          textField('Parse errors omitted', parsed.errorCount - parsed.errors.length), ...captured.fields] },
      ],
      markup: captured.markup, noMarkup: total ? 'Complete original JSON-LD scripts not retained' : 'No JSON-LD scripts found',
    })
  },
}
