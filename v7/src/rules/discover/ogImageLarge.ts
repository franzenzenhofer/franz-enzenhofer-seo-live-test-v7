import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField, urlField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const SELECTOR = 'meta[property="og:image" i], meta[property^="og:image:" i]'
const property = (node: Element) => (node.getAttribute('property') || '').toLowerCase()
const isImage = (node: Element) => ['og:image', 'og:image:url'].includes(property(node))
const dimension = (node: Element | undefined) => {
  const raw = node?.getAttribute('content')?.trim() || ''
  const value = /^\d+$/.test(raw) ? Number(raw) : NaN
  const number = Number.isSafeInteger(value) && value > 0 ? value : null
  return { number, display: number !== null ? `${number} px` : node ? `Invalid: ${raw || '(empty)'}` : 'Not declared' }
}
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
    const ok = !!imageUrl.trim() && width.number !== null && width.number >= 1200 && area !== null && area > 300000n
    const { sample, total } = sampleElements(nodes)
    const captured = markupEvidence(sample, 'OG image metadata')
    return presentResult(discoverOgImageLargeRule, page, {
      input: 'Idle DOM', type: ok ? 'ok' : 'warn', priority: ok ? 850 : 450,
      values: [textField('Declared width', width.display), textField('Declared height', height.display)],
      detailValues: [imageUrl ? urlField('Image URL', imageUrl) : textField('Image URL', start < 0 ? 'Not declared' : 'Empty'),
        textField('Declared images', nodes.filter(isImage).length), textField('Calculated area', area === null ? 'Not measurable' : `${area} px²`),
        textField('Image file dimensions', 'Not measured')],
      checked: [textField('Selector', SELECTOR), textField('Image selection', 'First image; following properties up to the next image'),
        textField('Dimension selection', 'First width and height in the selected image group'), textField('Number format', 'Positive integer'),
        textField('Width criterion', 'At least 1200 px'), textField('Area criterion', 'More than 300,000 px²')],
      evidence: [{ name: 'Capture', fields: [textField('Metadata elements retained', sample.length), textField('Metadata elements omitted', total - sample.length), ...captured.fields] }],
      markup: captured.markup, noMarkup: total ? 'Complete original OG image metadata not retained' : 'No OG image metadata found',
    })
  },
}
