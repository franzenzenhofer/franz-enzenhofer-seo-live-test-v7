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

export const nofollowRule: Rule = {
  id: 'body:nofollow',
  name: 'Nofollow Links',
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links',
    ],
    description: 'Counts links whose rel token list contains nofollow and reports the count as info; ok when none exist.',
  },
  async run(page) {
    const { sample, total, shown } = sampleElements(page.doc.querySelectorAll('a[rel~="nofollow"]'))
    const captured = markupEvidence(sample, 'Nofollow link markup')
    const captureStatus = captured.fields.filter((field) => !field.key.startsWith('DOM path'))
    return presentResult(nofollowRule, page, {
      input: 'Idle DOM', type: total ? 'info' : 'ok', priority: total ? 700 : 850,
      values: [textField('Nofollow links', total)],
      detailValues: [textField('Examples retained', shown), textField('Examples omitted', total - shown)],
      checked: [textField('Selector', 'a[rel~="nofollow"]'), textField('Match', 'Rel token list contains nofollow'),
        textField('Criterion', 'Reports the observed nofollow link count')],
      evidence: [...sample.map((link, index) => ({
        name: `Nofollow link ${index + 1}`,
        fields: [textField('Link text (whitespace collapsed, first 100 characters)', excerpt((link.textContent || '').replace(/\s+/g, ' ').trim()) || 'Empty'),
          resolvedHttpField('Href', link.getAttribute('href') || '', page.url),
          textField('Rel value', link.getAttribute('rel') || 'Not declared'),
          textField('DOM path', captured.selectors[index] || 'Not captured')],
      })), ...(captureStatus.length ? [{ name: 'Capture status', fields: captureStatus }] : [])],
      markup: captured.markup,
      noMarkup: total ? 'Complete original nofollow link markup not retained' : 'No rel=nofollow links found',
    })
  },
}
