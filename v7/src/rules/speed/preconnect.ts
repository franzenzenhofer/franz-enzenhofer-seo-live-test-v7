import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField, urlField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const SELECTOR = 'link[rel="preconnect"]'
const isHttpUrl = (value: string, base: string) => { try { return /^https?:$/.test(new URL(value, base).protocol) } catch { return false } }
const hrefField = (raw: string | null, base: string) => !raw ? textField('Href', raw === null ? 'Absent' : 'Empty')
  : isHttpUrl(raw, base) ? urlField('Href', raw) : textField('Href', raw)

export const preconnectRule: Rule = {
  id: 'speed:preconnect',
  name: 'rel=preconnect',
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: "A preconnect hint asks the browser to prepare a connection to an origin before a resource needs it. This lists declared hints; it does not prove that a connection was opened or that the hint improved loading.",
      action: "Use preconnect for a small number of important origins needed early. Remove unused hints and configure crossorigin where required by the actual resource request; verify the effect in network timing.",
    },
    provenance: 'standard',
    references: [
      'https://html.spec.whatwg.org/multipage/links.html#link-type-preconnect',
      'https://developer.chrome.com/docs/lighthouse/performance/uses-rel-preconnect',
    ],
    description: 'Info-only count of <link rel="preconnect"> elements with their hrefs.',
  },
  async run(page) {
    const links = page.doc.querySelectorAll(SELECTOR)
    const { sample, total, shown } = sampleElements(links)
    const captured = markupEvidence(sample, 'Preconnect link markup')
    return presentResult(preconnectRule, page, {
      input: 'Static DOM', type: 'info', priority: total ? 750 : 900,
      values: [textField('Preconnect links', total)],
      detailValues: [textField('Elements retained', shown), textField('Elements omitted', total - shown)],
      checked: [textField('Selector', SELECTOR), textField('Selection', 'All matches'), textField('Attribute', 'href'), textField('Criterion', 'Descriptive count; no threshold')],
      evidence: sample.map((element, index) => ({ name: `Preconnect link ${index + 1}`, fields: [
        hrefField(element.getAttribute('href'), page.url), textField('DOM path', captured.selectors[index] || 'Not captured'),
      ] })),
      markup: captured.markup, noMarkup: total ? 'Complete original preconnect link markup not retained' : 'No preconnect link element found',
    })
  },
}
