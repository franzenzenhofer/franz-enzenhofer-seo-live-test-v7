import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { textField, urlField } from '@/shared/presentation/create'
import type { DisplayField } from '@/shared/presentation/schema'
import type { RedirectChain, RedirectHop } from '@/shared/redirectChainTypes'

export type Verdict = { type: 'ok' | 'warn' | 'error' | 'info'; priority: number; classification: string }

// Same branch conditions and order as the original rule; only the prose message
// is replaced with a short labelled classification fact.
export const soft404Verdict = (chain: RedirectChain): Verdict => {
  const status = chain.finalStatus
  if (chain.loop || chain.capped) {
    return { type: 'error', priority: 40, classification: chain.loop ? 'Redirect loop' : `Hop cap exceeded (${chain.maxHops} hops)` }
  }
  // Google treats all 4xx except 429 the same: content doesn't exist. 410 is as valid as 404.
  if (status === 404 || status === 410) {
    return chain.redirected
      ? { type: 'info', priority: 700, classification: `Redirected to a ${status} (expected a direct response)` }
      : { type: 'ok', priority: 900, classification: `Direct HTTP ${status} (expected)` }
  }
  if (status === 200) return { type: 'error', priority: 50, classification: 'Soft 404 - HTTP 200 instead of 404' }
  // A rate limit or a server error says nothing about how this site handles a
  // missing URL. Reporting either as a soft 404 would be an invented finding.
  if (status === 429) return { type: 'warn', priority: 600, classification: 'Inconclusive - rate limited (429)' }
  if (status >= 500) return { type: 'warn', priority: 600, classification: 'Inconclusive - server error' }
  if (status >= 400) return { type: 'ok', priority: 850, classification: 'Other 4xx status (not 404, 410 or 429)' }
  if (status >= 300) return { type: 'warn', priority: 600, classification: 'Inconclusive - unfollowable redirect' }
  return { type: 'warn', priority: 600, classification: status ? 'Inconclusive - unexpected status' : 'Inconclusive - no response captured' }
}

const hopField = (hop: RedirectHop, index: number): { name: string; fields: DisplayField[] } => ({
  name: `Hop ${index + 1}`,
  fields: [
    urlField('URL', hop.url),
    textField('Status', hop.status > 0 ? httpStatusLabel(hop.status) : 'Not captured'),
    ...(hop.location ? [urlField('Redirect target', hop.location)] : []),
  ],
})

export const chainEvidence = (hops: RedirectHop[]) => hops.map(hopField)

export const chainDetailValues = (chain: RedirectChain) => [
  textField('Redirected', chain.redirected ? 'Yes' : 'No'),
  textField('Redirect count', chain.redirectCount),
  textField('Loop detected', chain.loop ? 'Yes' : 'No'),
  textField('Hop cap reached', chain.capped ? 'Yes' : 'No'),
  textField('HTTPS to HTTP downgrade', chain.httpDowngrade ? 'Yes' : 'No'),
  ...(chain.hopsHidden ? [textField('Hops hidden by runtime', 'Yes')] : []),
  ...(chain.note ? [textField('Note', chain.note)] : []),
]
