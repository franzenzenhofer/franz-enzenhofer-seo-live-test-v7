import type { Rule } from '@/core/types'
import { pageEffectiveRobots } from '@/shared/effectiveRobots'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const SELECTOR = 'meta[name="robots" i], meta[name="googlebot" i]'
export const discoverMaxImagePreviewLargeRule: Rule = {
  id: 'discover:max-image-preview-large', name: 'Large image preview permission', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/appearance/google-discover', 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'],
    description: 'Reports the effective Googlebot image-preview directive and noimageindex across applicable meta tags and captured headers.',
  },
  async run(page) {
    const effective = pageEffectiveRobots(page)
    const headersCaptured = page.headers !== undefined || page.responseHeaderFields !== undefined
    const ok = effective.maxImagePreview === 'large' && !effective.noimageindex
    const { sample, total } = sampleElements(page.doc.querySelectorAll(SELECTOR))
    const captured = markupEvidence(sample, 'Robots meta')
    return presentResult(discoverMaxImagePreviewLargeRule, page, {
      input: headersCaptured ? 'Static DOM + HTTP response headers' : 'Static DOM',
      type: !headersCaptured ? 'runtime_error' : ok ? 'ok' : 'warn', priority: ok && headersCaptured ? 800 : 400,
      values: [textField('max-image-preview', effective.maxImagePreview || 'Not declared in checked input'),
        textField('noimageindex', effective.noimageindex ? 'Observed' : 'Not observed'),
        ...(!headersCaptured ? [textField('Check completeness', 'Response headers not captured')] : [])],
      detailValues: [textField('Meta elements retained', sample.length), textField('Meta elements omitted', total - sample.length)],
      checked: [textField('DOM selector', SELECTOR), textField('Header', headersCaptured ? 'X-Robots-Tag' : 'Not captured'),
        textField('Crawler', 'Googlebot'), textField('Resolution', 'Most restrictive applicable instruction'),
        textField('Criterion', 'max-image-preview:large with no noimageindex instruction')],
      evidence: [...effective.directives.map((directive, index) => ({ name: `Instruction ${index + 1}`, fields: [
        textField('Source', directive.source === 'meta' ? 'Meta tag' : 'HTTP response header'),
        textField('Crawler', directive.ua), textField('Instruction', directive.value),
        ...(directive.headerKey ? [textField('Header name', directive.headerKey)] : []),
      ] })), ...(captured.fields.length ? [{ name: 'Meta source locations', fields: captured.fields }] : [])],
      markup: captured.markup, noMarkup: total ? 'Complete original robots meta markup not retained' : 'No applicable robots meta element found',
    })
  },
}
