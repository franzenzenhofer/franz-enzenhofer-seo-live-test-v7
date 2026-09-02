import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'
import { sampleElements } from '@/shared/domEvidence'

const SELECTOR = 'meta[name="viewport"]'
const LABEL = 'HEAD'
const NAME = 'Meta Viewport'
const TESTED = 'Detected <meta name="viewport"> presence and validated its content.'

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
  id: 'head:meta-viewport',
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developer.chrome.com/docs/lighthouse/pwa/viewport'],
    description: 'Checks meta[name=viewport]: warns when the tag is missing and validates its content (expects width=device-width, flags initial-scale below 1 and user-scalable=no).',
  },
  async run(page) {
    const elements = sampleElements(page.doc.querySelectorAll(SELECTOR))
    if (elements.total === 0) {
      return { name: NAME, label: LABEL, message: 'No meta viewport tag found. (Mobile devices render at desktop width and scale down)', type: 'warn', priority: 200, details: { tested: TESTED } }
    }
    const first = elements.sample[0]!
    const sourceHtml = extractHtml(first)
    const content = (first.getAttribute('content') || '').trim()
    const issues = findViewportIssues(parseViewport(content))
    const countNote = elements.total > 1 ? ` (${elements.total} viewport tags)` : ''
    const hasIssues = issues.length > 0
    return {
      name: NAME,
      label: LABEL,
      message: hasIssues
        ? `Meta viewport issues: ${issues.join('; ')}${countNote}.`
        : `Meta viewport configured for mobile: ${content}${countNote}.`,
      type: hasIssues ? 'warn' : 'ok',
      priority: hasIssues ? 300 : 700,
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        domPath: getDomPath(first),
        count: elements.total,
        shown: elements.shown,
        truncated: elements.truncated,
        content,
        issues,
        tested: TESTED,
      },
    }
  },
}
