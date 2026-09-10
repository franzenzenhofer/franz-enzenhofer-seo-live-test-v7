import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const SELECTOR = 'meta[name="viewport" i]'
const NAME = 'Meta Viewport'
const checked = [
  textField('Selector', SELECTOR),
  textField('Selection', 'First matching viewport tag'),
  textField('Width check', 'width must equal device-width'),
  textField('Initial scale check', 'Numeric initial-scale below 1 is an issue'),
  textField('Zoom check', 'user-scalable=no or 0 is an issue'),
]

const parseViewport = (content: string): Record<string, string> => {
  const entries: Record<string, string> = {}
  for (const part of content.split(',')) {
    const [key, value] = part.split('=').map((piece) => piece.trim().toLowerCase())
    if (key) entries[key] = value ?? ''
  }
  return entries
}

const findViewportIssues = (props: Record<string, string>): string[] => {
  const issues: string[] = []
  if (props['width'] !== 'device-width') issues.push('missing width=device-width')
  const initialScale = Number.parseFloat(props['initial-scale'] ?? '')
  if (Number.isFinite(initialScale) && initialScale < 1) issues.push(`initial-scale=${props['initial-scale']} (below 1)`)
  if (props['user-scalable'] === 'no' || props['user-scalable'] === '0') issues.push('user-scalable=no (blocks zoom)')
  return issues
}

export const metaViewportRule: Rule = {
  id: 'head:meta-viewport', name: NAME, presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google', references: ['https://developer.chrome.com/docs/lighthouse/pwa/viewport'],
    description: 'Checks meta[name=viewport]: warns when the tag is missing and validates its content (expects width=device-width, flags initial-scale below 1 and user-scalable=no).',
  },
  async run(page) {
    const elements = sampleElements(page.doc.querySelectorAll(SELECTOR))
    if (!elements.total) return presentResult(metaViewportRule, page, {
      input: 'Idle DOM', type: 'warn', priority: 200,
      values: [textField('Viewport tags', 0), textField('Viewport status', 'Not found')], checked,
      noMarkup: 'No meta viewport element found',
    })

    const first = elements.sample[0]!
    const content = (first.getAttribute('content') || '').trim()
    const props = parseViewport(content)
    const issues = findViewportIssues(props)
    const captured = markupEvidence(elements.sample, 'Viewport tag')
    return presentResult(metaViewportRule, page, {
      input: 'Idle DOM', type: issues.length ? 'warn' : 'ok', priority: issues.length ? 300 : 700,
      values: [textField('Viewport tags', elements.total), textField('Content (trimmed)', content || 'Empty'),
        textField('Viewport issues', issues.join('; ') || 'None')],
      detailValues: ['width', 'initial-scale', 'user-scalable'].map((key) => textField(key,
        key in props ? props[key] || 'Empty' : 'Not declared')),
      checked,
      evidence: [{ name: 'Capture', fields: [textField('Elements retained', elements.shown), textField('Elements omitted', elements.total - elements.shown), ...captured.fields] }],
      markup: captured.markup, noMarkup: 'Complete original viewport markup not retained',
    })
  },
}
