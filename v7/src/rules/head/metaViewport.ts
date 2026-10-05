import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'

const SELECTOR = 'meta[name="viewport" i]'
const NAME = 'Meta Viewport'
const DIRECTIVES = ['width', 'initial-scale', 'user-scalable'] as const
const OVERVIEW_MARKUP_LIMIT = 3
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

const hasIssues = (props: Record<string, string>): boolean => {
  if (props['width'] !== 'device-width') return true
  const initialScale = Number.parseFloat(props['initial-scale'] ?? '')
  if (Number.isFinite(initialScale) && initialScale < 1) return true
  return props['user-scalable'] === 'no' || props['user-scalable'] === '0'
}

// Overview: the three checked directives as declared (or Not declared), then the complete <meta name="viewport"> element(s).
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
      values: [textField('Meta viewport', 'Not found')], checked,
      noMarkup: 'No meta viewport element found',
    })

    const first = elements.sample[0]!
    const props = parseViewport((first.getAttribute('content') || '').trim())
    const issues = hasIssues(props)
    const records = elementRecords(elements.sample, elements.total)
    const overviewMarkup = records.markup.length <= OVERVIEW_MARKUP_LIMIT ? records.markup : []
    return presentResult(metaViewportRule, page, {
      input: 'Idle DOM', type: issues ? 'warn' : 'ok', priority: issues ? 300 : 700,
      values: [...(elements.total > 1 ? [textField('Viewport tags', elements.total)] : []),
        ...DIRECTIVES.map((key) => textField(key, key in props ? props[key] || 'Empty' : 'Not declared')), ...overviewMarkup],
      detailValues: records.counts, checked, evidence: records.evidence, markup: records.markup,
      noMarkup: 'Complete original viewport markup not retained',
    })
  },
}
