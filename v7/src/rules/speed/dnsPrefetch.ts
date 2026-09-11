import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import {domPathField, textField, urlField} from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const SELECTOR = 'link[rel="dns-prefetch"]'
const isHttpUrl = (value: string, base: string) => { try { return /^https?:$/.test(new URL(value, base).protocol) } catch { return false } }
const hrefField = (raw: string | null, base: string) => !raw ? textField('Href', raw === null ? 'Absent' : 'Empty')
  : isHttpUrl(raw, base) ? urlField('Href', raw) : textField('Href', raw)

export const dnsPrefetchRule: Rule = {
  id: 'speed:dns-prefetch',
  name: 'rel=dns-prefetch',
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: "A dns-prefetch hint asks the browser to look up a hostname early. The listed URLs are hints, not proof of faster loading. No hints can be appropriate when the page has no useful third-party connections to prepare.",
      action: "Add hints only for hostnames the page is likely to use, and measure whether they help. Remove stale hints when the corresponding service is no longer used.",
    },
    provenance: 'standard',
    references: ['https://html.spec.whatwg.org/multipage/links.html#link-type-dns-prefetch'],
    description: 'Info-only count of <link rel="dns-prefetch"> elements with their target hrefs.',
  },
  async run(page) {
    const links = page.doc.querySelectorAll(SELECTOR)
    const { sample, total, shown } = sampleElements(links)
    const captured = markupEvidence(sample, 'DNS-prefetch link markup')
    return presentResult(dnsPrefetchRule, page, {
      input: 'Static DOM', type: 'info', priority: total ? 750 : 900,
      values: [textField('DNS-prefetch links', total)],
      detailValues: [textField('Elements retained', shown), textField('Elements omitted', total - shown)],
      checked: [textField('Selector', SELECTOR), textField('Selection', 'All matches'), textField('Attribute', 'href'), textField('Criterion', 'Descriptive count; no threshold')],
      evidence: sample.map((element, index) => ({ name: `DNS-prefetch link ${index + 1}`, fields: [
        hrefField(element.getAttribute('href'), page.url), domPathField('DOM path', captured.selectors[index], 'Not captured'),
      ] })),
      markup: captured.markup, noMarkup: total ? 'Complete original dns-prefetch link markup not retained' : 'No dns-prefetch link element found',
    })
  },
}
