import { attrUrlField, countRow, excerpt, INVENTORY_LIMIT, inventory, urlLabel } from './elementInventory'

import type { Rule } from '@/core/types'
import { sampleMatchingElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import { listRow } from '@/shared/presentation/listRow'

// The CSS form of the match: either attribute absent or empty.
const SELECTOR = 'img:not([width]), img:not([height]), img[width=""], img[height=""]'
const missingAttributes = (image: Element) => ['width', 'height'].filter((key) => !image.getAttribute(key))
const checked = [textField('Selector', SELECTOR), textField('Attributes', 'width and height'),
  textField('Match', 'Either attribute is absent or empty'), textField('Criterion', 'Every image has both attributes')]

export const imagesLayoutRule: Rule = {
  id: 'body:images-layout', name: 'Image dimension attributes', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google', references: ['https://web.dev/articles/optimize-cls#images-without-dimensions', 'https://web.dev/articles/cls'],
    description: 'Identifies images missing width or height attributes by name and URL, without claiming to measure layout shifts.',
    userGuide: {
      check: 'Looks for width and height attributes on img elements. Reserving space before images load helps avoid page movement. Attribute values and CSS layout are not validated by this presence check.',
      action: 'For each listed image, declare width and height matching its aspect ratio, or verify that CSS already reserves the correct space. Set this in the image component or CMS template and recheck the page while images load.',
    },
  },
  async run(page) {
    const images = page.doc.querySelectorAll<HTMLImageElement>('img')
    const missing = sampleMatchingElements(images, (image) => missingAttributes(image).length > 0, INVENTORY_LIMIT)
    const records = inventory(missing.sample, missing.total, (image) => [
      attrUrlField('src', image.getAttribute('src'), page.url),
      textField('alt', excerpt((image.getAttribute('alt') || '')) || 'Not declared'),
      textField('Missing attributes', missingAttributes(image).join(', ')),
    ])
    const sources = missing.sample.map((image) => urlLabel(image.getAttribute('src') || '', page.url))
    return presentResult(imagesLayoutRule, page, {
      input: 'Idle DOM', type: !images.length ? 'info' : missing.total ? 'warn' : 'ok', priority: missing.total ? 300 : 850,
      values: [...countRow('Missing dimensions', missing.total, records.overviewMarkup),
        ...countRow('Images checked', images.length, records.overviewMarkup),
        ...(missing.total && !records.overviewMarkup.length ? [textField('Sources', listRow(sources))] : []),
        ...records.overviewMarkup],
      detailValues: missing.total ? records.counts : [], checked, evidence: records.evidence, markup: records.markup,
      noMarkup: missing.total ? 'Complete original markup for affected images not retained' : !images.length ? 'No img elements found' : 'No image with missing dimensions found',
    })
  },
}
