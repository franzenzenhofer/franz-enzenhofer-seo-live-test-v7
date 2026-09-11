import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import {domPathField, textField, urlField} from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const SELECTOR = 'link[rel="preload"]'
const isHttpUrl = (value: string, base: string) => { try { return /^https?:$/.test(new URL(value, base).protocol) } catch { return false } }
const hrefField = (raw: string | null, base: string) => !raw ? textField('Href', raw === null ? 'Absent' : 'Empty')
  : isHttpUrl(raw, base) ? urlField('Href', raw) : textField('Href', raw)

export const linkPreloadRule: Rule = {
  id: 'speed:link-preload',
  name: 'rel=preload links',
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: "A preload hint asks the browser to fetch a resource early. The URLs below show what the page requests. This presence check does not validate the as/type/crossorigin settings or prove the preloaded resource is used.",
      action: "Preload only resources needed soon that are otherwise discovered late. Match the actual URL, resource type and request credentials; remove unused or duplicate preloads and measure the effect.",
    },
    provenance: 'standard',
    references: [
      'https://html.spec.whatwg.org/multipage/links.html#link-type-preload',
      'https://developer.chrome.com/docs/lighthouse/performance/uses-rel-preload',
    ],
    description: 'Info-only count of <link rel="preload"> elements with their hrefs.',
  },
  async run(page) {
    const links = page.doc.querySelectorAll(SELECTOR)
    const { sample, total, shown } = sampleElements(links)
    const captured = markupEvidence(sample, 'Preload link markup')
    const captureFields = captured.fields.filter((field) => !field.key.startsWith('DOM path'))
    return presentResult(linkPreloadRule, page, {
      input: 'Static DOM', type: 'info', priority: total ? 750 : 900,
      values: [textField('Preload links', total)],
      detailValues: [textField('Elements retained', shown), textField('Elements omitted', total - shown)],
      checked: [textField('Selector', SELECTOR), textField('Attribute', 'href'), textField('Criterion', 'Descriptive count; no threshold')],
      evidence: [...sample.map((element, index) => ({ name: `Preload link ${index + 1}`, fields: [
        hrefField(element.getAttribute('href'), page.url), domPathField('DOM path', captured.selectors[index], 'Not captured'),
      ] })), ...(captureFields.length ? [{ name: 'Capture status', fields: captureFields }] : [])],
      markup: captured.markup, noMarkup: total ? 'Complete original preload link markup not retained' : 'No preload link element found',
    })
  },
}
