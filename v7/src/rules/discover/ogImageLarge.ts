import { overviewMarkup } from './discoverPresentation'

import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField, urlField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'
import type { DisplayField } from '@/shared/presentation/schema'

const SELECTOR = 'meta[property="og:image" i], meta[property^="og:image:" i]'
const MIN_WIDTH = 1200
const MIN_AREA = 300000n
const checked = [textField('Selector', SELECTOR), textField('Image selection', 'First image; following properties up to the next image'),
  textField('Dimension selection', 'First width and height in the selected image group'), textField('Number format', 'Positive integer'),
  textField('Width criterion', `At least ${MIN_WIDTH} px`), textField('Area criterion', `More than ${MIN_AREA.toLocaleString('en-US')} px²`),
  textField('Image file', 'Not checked')]
const property = (node: Element) => (node.getAttribute('property') || '').toLowerCase()
const isImage = (node: Element) => ['og:image', 'og:image:url'].includes(property(node))
const isHttpUrl = (value: string, base: string) => { try { return /^https?:$/.test(new URL(value, base).protocol) } catch { return false } }
const dimension = (node: Element | undefined) => {
  const raw = node?.getAttribute('content')?.trim() || ''
  const value = /^\d+$/.test(raw) ? Number(raw) : NaN
  const number = Number.isSafeInteger(value) && value > 0 ? value : null
  return { number, display: number !== null ? `${number} px` : node ? `Invalid: ${raw || '(empty)'}` : 'Not declared' }
}
// The declared content: an image URL is a link when it resolves to HTTP(S); dimensions stay literal text.
const contentField = (key: string, value: string, base: string, isUrl: boolean): DisplayField =>
  value ? (isUrl && isHttpUrl(value, base) ? urlField(key, value) : textField(key, value)) : textField(key, 'Empty')

export const discoverOgImageLargeRule: Rule = {
  id: 'discover:og-image-large', name: 'Open Graph image dimensions', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google', references: ['https://developers.google.com/search/docs/appearance/google-discover', 'https://ogp.me/'],
    description: 'Checks the first OG image’s associated width and height declarations against 1200 px width and more than 300,000 pixels; does not measure the image file.',
  },
  async run(page) {
    const nodes = Array.from(page.doc.querySelectorAll(SELECTOR))
    const start = nodes.findIndex(isImage)
    const following = start >= 0 ? nodes.slice(start + 1) : []
    const next = following.findIndex(isImage)
    const group = start >= 0 ? [nodes[start]!, ...following.slice(0, next < 0 ? undefined : next)] : []
    const imageUrl = group[0]?.getAttribute('content') || ''
    const width = dimension(group.find((node) => property(node) === 'og:image:width'))
    const height = dimension(group.find((node) => property(node) === 'og:image:height'))
    const area = width.number !== null && height.number !== null ? BigInt(width.number) * BigInt(height.number) : null
    const ok = !!imageUrl.trim() && width.number !== null && width.number >= MIN_WIDTH && area !== null && area > MIN_AREA
    const { sample, total } = sampleElements(nodes)
    const records = elementRecords(sample, total, (node) => [contentField('content', node.getAttribute('content') || '', page.url, isImage(node))])
    return presentResult(discoverOgImageLargeRule, page, {
      input: 'Idle DOM', type: ok ? 'ok' : 'warn', priority: ok ? 850 : 450,
      values: [start < 0 ? textField('og:image', 'Not found') : contentField('og:image', imageUrl, page.url, true),
        textField('Declared width', width.display), textField('Declared height', height.display), ...overviewMarkup(records.markup)],
      detailValues: [textField('Declared images', nodes.filter(isImage).length),
        textField('Calculated area', area === null ? 'Not checked' : `${area} px²`), ...records.counts],
      checked, evidence: records.evidence, markup: records.markup,
      noMarkup: total ? 'Complete original OG image metadata not retained' : 'No OG image metadata found',
    })
  },
}
