import { attrUrlField, excerpt, INVENTORY_LIMIT, inventory, urlLabel } from './elementInventory'

import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { DisplayField } from '@/shared/presentation/schema'
import { listRow } from '@/shared/presentation/listRow'

const loadingKind = (image: HTMLImageElement): 'lazy' | 'eager' | 'unset' => {
  const value = image.getAttribute('loading')
  if (value === null) return 'unset'
  return value.trim().toLowerCase() === 'lazy' ? 'lazy' : 'eager'
}
type Kind = ReturnType<typeof loadingKind>
const KINDS: Kind[] = ['lazy', 'eager', 'unset']

// The observed loading instructions as one row: a single image's instruction, or the three counts (F1, F3, F12).
const overview = (kinds: Kind[], sources: string[], markup: DisplayField[]): DisplayField[] => {
  if (!kinds.length) return [textField('Images', 0)]
  const loading = kinds.length === 1 ? kinds[0]! : KINDS.map((kind) => `${kinds.filter((item) => item === kind).length} ${kind}`).join(', ')
  return [textField('Loading', loading), ...(markup.length ? [] : [textField('Sources', listRow(sources))]), ...markup]
}

export const imagesLazyRule: Rule = {
  id: 'body:images-lazy',
  name: 'Images lazy-loading',
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: 'Counts image loading instructions. Lazy means loading may wait until the image is near the viewport; eager and an omitted loading attribute use immediate loading. This does not measure image position or identify the main visible image.',
      action: 'Review image placement before changing loading behavior. Load the main visible image promptly and consider lazy loading for images farther down the page.',
    },
    provenance: 'google',
    references: [
      'https://web.dev/articles/browser-level-image-lazy-loading',
    ],
    description: 'Reports lazy/eager/unset loading-attribute counts for images as a neutral info fact; absent attributes are the eager browser default.',
  },
  async run(page) {
    const imgs = page.doc.querySelectorAll<HTMLImageElement>('img')
    const kinds = Array.from(imgs, loadingKind)
    const all = sampleElements(imgs, INVENTORY_LIMIT)
    const records = inventory(all.sample, all.total, (image) => [
      textField('loading', image.getAttribute('loading') === null ? 'Not declared' : image.getAttribute('loading') || 'Empty'),
      attrUrlField('src', image.getAttribute('src'), page.url),
      textField('alt', excerpt(image.getAttribute('alt') || '') || 'Not declared'),
    ])
    const sources = all.sample.map((image) => urlLabel(image.getAttribute('src') || '', page.url))
    return presentResult(imagesLazyRule, page, {
      input: 'Idle DOM', type: 'info', priority: 750,
      values: overview(kinds, sources, records.overviewMarkup),
      detailValues: all.total ? records.counts : [],
      checked: [textField('Selector', 'img'), textField('Attribute', 'loading'),
        textField('Classification', 'lazy = trimmed value "lazy" (case-insensitive); eager = any other declared value; unset = attribute absent'), textField('Criterion', 'Reports observed loading instructions')],
      evidence: records.evidence, markup: records.markup,
      noMarkup: all.total ? 'Complete original img markup not retained' : 'No img elements found',
    })
  },
}
