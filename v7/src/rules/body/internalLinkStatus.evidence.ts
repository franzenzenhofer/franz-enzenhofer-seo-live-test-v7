import { probeError } from './elementInventory'

import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { domPathField, textField, urlField } from '@/shared/presentation/create'
import type { DisplayField, EvidenceRecord } from '@/shared/presentation/schema'
import type { RedirectChain, RedirectHop } from '@/shared/redirectChainTypes'

export type LinkCheck = {
  url: string
  status: number
  domPath: string
  finalUrl?: string
  error?: string
  redirectChain?: RedirectChain
  redirectChainHops?: RedirectHop[]
}

const httpUrlField = (key: string, value: string) => {
  try { return ['http:', 'https:'].includes(new URL(value).protocol) ? urlField(key, value) : textField(key, value) } catch { return textField(key, value || 'Not captured') }
}

// Every redirecting hop as its own labelled status and Location fields (F9: URLs are url fields, never prose).
const hopFields = (hops: RedirectHop[]): DisplayField[] => hops.flatMap((hop, index) => [
  textField(`Hop ${index + 1}`, httpStatusLabel(hop.status || undefined)),
  ...(hop.location ? [httpUrlField(`Hop ${index + 1} location`, hop.location)] : []),
])

const chainSummary = (chain: RedirectChain): string => {
  if (chain.loop) return 'Redirect loop'
  if (chain.capped) return `Hop cap reached after ${chain.maxHops} redirects`
  if (chain.hopsHidden) return 'Redirects hidden by runtime'
  const downgrade = chain.httpDowngrade ? ', HTTPS to HTTP downgrade' : ''
  return `${chain.redirectCount} redirect${chain.redirectCount === 1 ? '' : 's'}${downgrade}`
}

export const checkedLinks = (checks: LinkCheck[]): EvidenceRecord[] => checks.map((check, index) => ({
  name: `Link ${index + 1}`,
  fields: [
    httpUrlField('URL', check.url),
    textField('Status', check.error ? 'Request failed' : httpStatusLabel(check.status)),
    ...(check.finalUrl && check.finalUrl !== check.url ? [httpUrlField('Final URL', check.finalUrl)] : []),
    ...(check.error ? [textField('Error', probeError(check.error))] : []),
    ...(check.redirectChain?.redirected || check.redirectChain?.loop || check.redirectChain?.capped ? [textField('Redirect chain', chainSummary(check.redirectChain))] : []),
    ...(check.redirectChain ? hopFields(check.redirectChain.hops.filter((hop) => hop.location)) : []),
    ...(check.redirectChainHops?.length ? [textField('Hops before failure', check.redirectChainHops.length), ...hopFields(check.redirectChainHops)] : []),
    domPathField('DOM path', check.domPath, 'Not captured'),
  ],
}))

/** Overview row of the observed statuses, e.g. "3× 200, 1× 404, 1× failed" (F12). */
export const statusesRow = (checks: LinkCheck[]): DisplayField => {
  const counts = new Map<string, number>()
  for (const check of checks) {
    const key = check.error || !check.status ? 'failed' : String(check.status)
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return textField('Statuses', [...counts].map(([status, count]) => `${count}× ${status}`).join(', ') || 'None')
}
