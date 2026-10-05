import { evaluateLinkedImages } from './linkedImages'

import type { Rule } from '@/core/types'
import { attrUrlField, countRow, excerpt, inventory, urlLabel } from '@/rules/body/elementInventory'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { DisplayField } from '@/shared/presentation/schema'
import { listRow } from '@/shared/presentation/listRow'

const checked = [
  textField('Selector', 'a img'),
  textField('Image selection', 'First img descendant of each anchor'),
  textField('Match', 'Anchor contains an img with empty/absent alt and the anchor has no other text content'),
  textField('Criterion', 'No linked image lacks both alt text and link text'),
]
const passes = (link: HTMLAnchorElement) => {
  const img = link.querySelector('img')
  if (!img) return true
  if ((img.getAttribute('alt') || '').trim()) return true
  return (link.textContent || '').trim().length > 0
}
// Per-anchor facts: the first image's alt state, the link text and the href.
const linkFields = (base: string) => (link: Element): DisplayField[] => {
  const img = link.querySelector('img')
  return [
    textField('alt', !img || !img.hasAttribute('alt') ? 'Absent' : (img.getAttribute('alt') || '').trim() || 'Empty'),
    textField('Link text', excerpt(link.textContent || '') || 'Empty'),
    attrUrlField('href', link.getAttribute('href'), base),
  ]
}

export const linkedImagesAltRule: Rule = {
  id: 'a11y:linked-images-alt',
  name: 'Linked images need alt or text',
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'standard',
    references: [
      'https://html.spec.whatwg.org/multipage/images.html#a-link-or-button-containing-nothing-but-the-image',
      'https://html.spec.whatwg.org/multipage/images.html#alt',
      'https://developers.google.com/search/docs/appearance/google-images',
    ],
    description: 'Warns when a link contains an image with no (or empty) alt text and the link has no other text content; ok otherwise.',
  },
  async run(page) {
    const linked = Array.from(page.doc.querySelectorAll<HTMLAnchorElement>('a')).filter((link) => link.querySelector('img'))
    const result = evaluateLinkedImages(page, passes, 'linked images missing alt text or link text')
    const failing = result?.total ?? 0
    // Failing anchors are the evidence; when all pass, the inspected linked images are shown instead (F5).
    const shown = result ? { sample: result.failing, total: result.total } : sampleElements(linked)
    const records = inventory(shown.sample, shown.total, linkFields(page.url))
    const hrefs = shown.sample.map((link) => urlLabel(link.getAttribute('href') || '', page.url))
    return presentResult(linkedImagesAltRule, page, {
      input: 'Idle DOM', type: result ? 'warn' : 'ok', priority: result ? 100 : 850,
      values: [...countRow('Linked images', linked.length, records.overviewMarkup),
        ...countRow('Without alt or text', failing, records.overviewMarkup),
        ...(shown.total && !records.overviewMarkup.length ? [textField('Links', listRow(hrefs))] : []),
        ...records.overviewMarkup],
      detailValues: records.counts, checked, evidence: records.evidence, markup: records.markup,
      noMarkup: linked.length ? 'Complete original linked image markup not retained' : 'No linked image found',
    })
  },
}
