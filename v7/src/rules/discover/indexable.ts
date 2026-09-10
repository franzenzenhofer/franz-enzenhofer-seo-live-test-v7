import type { Rule } from '@/core/types'
import { pageEffectiveRobots } from '@/shared/effectiveRobots'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const SELECTOR = 'meta[name="robots" i], meta[name="googlebot" i]'
export const discoverIndexableRule: Rule = {
  id: 'discover:indexable', name: 'Google indexing permission', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag',
      'https://developers.google.com/search/docs/appearance/google-discover',
    ],
    description: 'Checks the effective noindex restriction for Googlebot across applicable robots meta tags and X-Robots-Tag headers.',
  },
  async run(page) {
    const effective = pageEffectiveRobots(page)
    const blocking = effective.directives.filter((entry) => entry.hasNoindex)
    const headersCaptured = page.headers !== undefined || page.responseHeaderFields !== undefined
    const { sample, total } = sampleElements(page.doc.querySelectorAll(SELECTOR))
    const captured = markupEvidence(sample, 'Robots meta')
    return presentResult(discoverIndexableRule, page, {
      input: headersCaptured ? 'Static DOM + HTTP response headers' : 'Static DOM',
      type: effective.noindex ? 'warn' : 'ok', priority: effective.noindex ? 150 : 850,
      values: [textField('noindex for Googlebot', effective.noindex ? 'Observed' : 'Not observed in checked input'),
        textField('Blocking instructions', blocking.length)],
      detailValues: [textField('Actual Google index status', 'Not checked'), textField('Applicable instructions', effective.directives.length),
        textField('Meta elements retained', sample.length), textField('Meta elements omitted', total - sample.length)],
      checked: [textField('DOM selector', SELECTOR), textField('Header', headersCaptured ? 'X-Robots-Tag' : 'Not captured'),
        textField('Crawler', 'Googlebot'), textField('Criterion', 'No applicable noindex or none instruction')],
      evidence: [...effective.directives.map((directive, index) => ({ name: `Instruction ${index + 1}`, fields: [
        textField('Source', directive.source === 'meta' ? 'HTML meta tag' : 'HTTP response header'),
        textField('Crawler', directive.ua === 'robots' ? 'All crawlers (including Googlebot)' : directive.ua),
        textField('Instruction', directive.value), textField('Contains noindex', directive.hasNoindex ? 'Yes' : 'No'),
        ...(directive.headerKey ? [textField('Header name', directive.headerKey)] : []),
      ] })), ...(captured.fields.length ? [{ name: 'Meta source locations', fields: captured.fields }] : [])],
      markup: captured.markup, noMarkup: total ? 'Complete original robots meta markup not retained' : 'No applicable robots meta element found',
    })
  },
}
