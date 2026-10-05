import { hrefField, hreflangOf, webUrlField } from './canonicalHreflangPresentation'
import type { HreflangCheck } from './hreflangTarget'

import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { textField } from '@/shared/presentation/create'
import type { DisplayField } from '@/shared/presentation/schema'

const MAX_ERROR = 160
const found = (value: boolean | undefined) => (value === undefined ? 'Not checked' : value ? 'Found' : 'Not found')

// The probe error without the wrapper that repeats the target URL (the record's href already names it).
export const failureReason = (message: string): string => {
  const wrapped = /^Redirect chain fetch failed at \S+: (.*?)(?: \(\d+ hops? captured before failure\))?$/s.exec(message)
  const timeout = /^Redirect chain timed out after (\S+) at \S+/.exec(message)
  const reason = wrapped?.[1] ?? (timeout ? `Timed out after ${timeout[1]}` : message)
  return reason.replace(/https?:\/\/\S+/g, 'target URL').slice(0, MAX_ERROR)
}

const redirectFields = (check: HreflangCheck): DisplayField[] => {
  const chain = check.chain
  if (!chain || !chain.redirected) return []
  return [
    textField('Redirects', chain.hopsHidden ? 'Hidden by runtime' : chain.redirectCount),
    textField('Status chain', chain.hops.map((hop) => (hop.status > 0 ? String(hop.status) : 'none')).join(' > ')),
    webUrlField('Final URL', chain.finalUrl),
    ...(chain.loop ? [textField('Redirect loop', 'Found')] : []),
    ...(chain.capped ? [textField('Redirect cap', `Exceeded after ${chain.maxHops} hops`)] : []),
  ]
}
const targetCanonical = (check: HreflangCheck): DisplayField => {
  if (check.canonicalHref === undefined) return textField('Target canonical', 'Not checked')
  if (!check.canonicalHref) return textField('Target canonical', 'Not declared')
  return check.canonical ? webUrlField('Target canonical', check.canonical) : textField('Target canonical', 'Invalid URL')
}

/** What the probe observed for one declared target: status, redirects, references, canonical, noindex. */
export const checkFields = (check: HreflangCheck): DisplayField[] => [
  textField('Status', check.error ? 'Request failed' : httpStatusLabel(check.status)),
  ...redirectFields(check),
  textField('Self reference', found(check.selfReference)),
  textField('Back reference', found(check.backReference)),
  targetCanonical(check),
  textField('noindex', found(check.noindex)),
  ...(check.bodyTruncated ? [textField('Body', 'Truncated by the response size limit')] : []),
  ...(check.error ? [textField('Error', failureReason(check.error))] : []),
  textField('Issues', check.issues.length),
]

type Cluster = { canonical: string; checks: Map<string, HreflangCheck>; resolve: (href: string) => string | null }

/** One evidence record per declared link (F7): its attributes, then the facts of the target it points to. */
export const linkFields = (element: Element, base: string, cluster: Cluster): DisplayField[] => {
  const href = cluster.resolve((element.getAttribute('href') || '').trim())
  const head = [textField('hreflang', hreflangOf(element) || 'Not declared'), hrefField(element, base)]
  if (!href) return [...head, textField('Target', 'Invalid URL')]
  if (href === cluster.canonical) return [...head, textField('Target', 'Self, not fetched')]
  const check = cluster.checks.get(href)
  return check ? [...head, ...checkFields(check)] : [...head, textField('Target', 'Not checked')]
}
