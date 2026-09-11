import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import {domPathField, textField, urlField} from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'Rel Alternate Media'
const RULE_ID = 'head:rel-alternate-media'
const SELECTOR = 'head > link[rel~="alternate" i][media][href]'

export const relAlternateMediaRule: Rule = {
  id: RULE_ID,
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing',
      'https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel',
    ],
    description: 'Detects link[rel=alternate][media][href] annotations (separate mobile URL configuration) and warns when present.',
  },
  async run(page) {
    const elements = sampleElements(page.doc.querySelectorAll(SELECTOR))
    const count = elements.total
    const mediaData = elements.sample.map((link) => ({
      media: link.getAttribute('media')?.trim() || '',
      href: link.getAttribute('href')?.trim() || '',
    }))
    const captured = markupEvidence(elements.sample, 'Alternate media link')
    const first = mediaData[0]
    const values = count
      ? [textField('Alternate media links', count),
        ...(count === 1 && first ? [textField('Media query', first.media || 'Empty'), first.href ? urlField('Declared URL', first.href) : textField('Declared URL', 'Empty')] : [])]
      : [textField('Alternate media links', 'Not found')]
    const evidence = mediaData.map(({ media, href }, index) => ({
      name: `Alternate media link ${index + 1}`,
      fields: [textField('Media query', media || 'Empty'), href ? urlField('Declared URL', href) : textField('Declared URL', 'Empty'),
        domPathField('DOM path', captured.selectors[index], 'Not captured')],
    }))
    return presentResult(relAlternateMediaRule, page, {
      input: 'Idle DOM', type: count ? 'warn' : 'info', priority: count ? 600 : 900, values,
      detailValues: [textField('Links shown', elements.shown), textField('Links omitted', count - elements.shown)],
      checked: [textField('Selector', SELECTOR), textField('Selection', 'All matches'), textField('Required attributes', 'rel, media, and href'),
        textField('Scope', 'Link elements directly under <head> with an alternate rel token')],
      evidence, markup: captured.markup,
      noMarkup: count ? 'Complete original alternate media markup not retained for all sampled links' : 'No matching alternate media link found',
    })
  },
}
