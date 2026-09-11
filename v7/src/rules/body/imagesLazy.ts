import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
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

const loadingKind = (image: HTMLImageElement): 'lazy' | 'eager' | 'unset' => {
  const value = image.getAttribute('loading')
  if (value === null) return 'unset'
  return value.trim().toLowerCase() === 'lazy' ? 'lazy' : 'eager'
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
    let lazyCount = 0, eagerCount = 0, unsetCount = 0
    for (let index = 0; index < imgs.length; index++) {
      const image = imgs.item(index)
      if (!image) continue
      const kind = loadingKind(image)
      if (kind === 'lazy') lazyCount++
      else if (kind === 'eager') eagerCount++
      else unsetCount++
    }

    const all = sampleElements(imgs)
    const captured = markupEvidence(all.sample, 'Image markup')
    const captureStatus = captured.fields.filter((field) => !field.key.startsWith('DOM path'))
    return presentResult(imagesLazyRule, page, {
      input: 'Idle DOM', type: 'info', priority: 750,
      values: [textField('Lazy images', lazyCount), textField('Eager images', eagerCount), textField('Unset loading', unsetCount)],
      detailValues: [textField('Image elements retained', all.shown), textField('Image elements omitted', all.total - all.shown)],
      checked: [textField('Selector', 'img'), textField('Attribute', 'loading'),
        textField('Classification', 'lazy = trimmed value "lazy" (case-insensitive); eager = any other declared value; unset = attribute absent'), textField('Criterion', 'Reports observed loading instructions')],
      evidence: [...all.sample.map((image, index) => ({
        name: `Image ${index + 1}`,
        fields: [textField('Loading instruction', image.getAttribute('loading') || '(omitted: eager by default)'),
          resolvedHttpField('Source URL', image.getAttribute('src') || '', page.url),
          textField('Alt text (first 100 characters)', excerpt((image.getAttribute('alt') || '').trim()) || 'Not declared'),
          textField('DOM path', captured.selectors[index] || 'Not captured')],
      })), ...(captureStatus.length ? [{ name: 'Capture status', fields: captureStatus }] : [])],
      markup: captured.markup,
      noMarkup: all.total ? 'Complete original img markup not retained' : 'No img elements found',
    })
  },
}
