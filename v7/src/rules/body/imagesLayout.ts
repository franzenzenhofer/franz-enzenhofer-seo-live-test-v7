import type { Rule } from '@/core/types'
import { sampleMatchingElements } from '@/shared/domEvidence'
import { textField, urlField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const EXCERPT_LIMIT = 100
const excerpt = (text: string) => (text.length > EXCERPT_LIMIT ? `${text.slice(0, EXCERPT_LIMIT)}…` : text)
const resolvedHttpField = (key: string, raw: string, base: string) => {
  const trimmed = raw.trim()
  if (!trimmed) return textField(key, 'Not declared')
  try { return ['http:', 'https:'].includes(new URL(trimmed, base).protocol) ? urlField(key, trimmed) : textField(key, trimmed) } catch { return textField(key, trimmed) }
}

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
    const missing = sampleMatchingElements(images, (image) => !image.getAttribute('width') || !image.getAttribute('height'))
    const captured = markupEvidence(missing.sample, 'Image markup')
    const captureStatus = captured.fields.filter((field) => !field.key.startsWith('DOM path'))
    return presentResult(imagesLayoutRule, page, {
      input: 'Idle DOM', type: !images.length ? 'info' : missing.total ? 'warn' : 'ok', priority: missing.total ? 300 : 850,
      values: [textField('Images checked', images.length), textField('Images missing dimensions', missing.total)],
      detailValues: [textField('Affected examples retained', missing.shown), textField('Affected examples omitted', missing.total - missing.shown)],
      checked: [textField('Selector', 'img'), textField('Attributes', 'width and height'),
        textField('Match', 'Either attribute is absent or empty'), textField('Criterion', 'Every image has both attributes')],
      evidence: [...missing.sample.map((image, index) => ({
        name: `Image ${index + 1}`,
        fields: [textField('Alt text (first 100 characters)', excerpt((image.getAttribute('alt') || '').trim()) || 'Not declared'),
          resolvedHttpField('Source URL', image.getAttribute('src') || '', page.url),
          textField('Missing attributes', ['width', 'height'].filter((key) => !image.getAttribute(key)).join(', ')),
          textField('DOM path', captured.selectors[index] || 'Not captured')],
      })), ...(captureStatus.length ? [{ name: 'Capture status', fields: captureStatus }] : [])],
      markup: captured.markup,
      noMarkup: missing.total ? 'Complete original markup for affected images not retained' : !images.length ? 'No img elements found' : 'No image with missing dimensions found',
    })
  },
}
