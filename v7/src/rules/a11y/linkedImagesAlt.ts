import { evaluateLinkedImages } from './linkedImages'

import type { Rule } from '@/core/types'
import {domPathField, textField, urlField} from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const EXCERPT_LIMIT = 100
const excerpt = (text: string) => (text.length > EXCERPT_LIMIT ? `${text.slice(0, EXCERPT_LIMIT)}…` : text)
const resolvedHttpField = (key: string, raw: string, base: string) => {
  const trimmed = raw.trim()
  if (!trimmed) return textField(key, 'Not declared')
  try { return ['http:', 'https:'].includes(new URL(trimmed, base).protocol) ? urlField(key, trimmed) : textField(key, trimmed) } catch { return textField(key, trimmed) }
}

const checked = [
  textField('Selector', 'a'),
  textField('Image selection', 'First img descendant of each anchor'),
  textField('Match', 'Anchor contains an img with empty/absent alt and the anchor has no other text content'),
  textField('Criterion', 'No linked image lacks both alt text and link text'),
]

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
    const result = evaluateLinkedImages(
      page,
      (link) => {
        const img = link.querySelector('img')
        if (!img) return true // Not a linked image, pass

        const alt = (img?.getAttribute('alt') || '').trim()
        if (alt) return true // Image has alt text, pass

        const linkText = (link.textContent || '').trim()
        return linkText.length > 0 // Pass if link has other text content
      },
      'linked images missing alt text or link text',
    )
    if (!result) return presentResult(linkedImagesAltRule, page, {
      input: 'Idle DOM', type: 'ok', priority: 850,
      values: [textField('Linked images missing alt or text', 0)], checked,
      noMarkup: 'No linked image missing alt text or link text found',
    })
    const captured = markupEvidence(result.failing, 'Linked image markup')
    const captureStatus = captured.fields.filter((field) => !field.key.startsWith('DOM path'))
    return presentResult(linkedImagesAltRule, page, {
      input: 'Idle DOM', type: 'warn', priority: 100,
      values: [textField('Linked images missing alt or text', result.total)],
      detailValues: [textField('Examples retained', result.failing.length), textField('Examples omitted', result.total - result.failing.length)],
      checked,
      evidence: [...result.failing.map((link, index) => ({
        name: `Linked image ${index + 1}`,
        fields: [resolvedHttpField('Link href', link.getAttribute('href') || '', page.url),
          textField('Image alt attribute', link.querySelector('img')?.hasAttribute('alt') ? 'Empty or whitespace only' : 'Absent'),
          textField('Link text', excerpt((link.textContent || '').trim()) || 'Empty'),
          domPathField('DOM path', captured.selectors[index], 'Not captured')],
      })), ...(captureStatus.length ? [{ name: 'Capture status', fields: captureStatus }] : [])],
      markup: captured.markup,
      noMarkup: 'Complete original linked image markup not retained',
    })
  },
}
