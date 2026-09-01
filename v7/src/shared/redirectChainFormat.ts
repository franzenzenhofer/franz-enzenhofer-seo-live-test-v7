import type { RedirectChain, RedirectHop } from './redirectChainTypes'

const hopLine = (hop: RedirectHop, index: number): string => {
  const status = hop.status > 0 ? `HTTP ${hop.status}` : 'HTTP status not captured'
  const target = hop.location ? ` -> Location: ${hop.location}` : ''
  return `${index + 1}. ${hop.url}\n   ${status}${target}`
}

/**
 * Full, untruncated text rendering of a redirect chain: every hop with its
 * URL, status and Location target, plus final URL/status and any findings
 * (loop, cap, https->http downgrade). Never shortened.
 */
export const formatRedirectChain = (chain: RedirectChain): string => {
  const lines = [`START ${chain.startUrl}`, ...chain.hops.map(hopLine)]
  lines.push(`FINAL URL ${chain.finalUrl}`)
  lines.push(`FINAL STATUS ${chain.finalStatus > 0 ? `HTTP ${chain.finalStatus}` : 'not captured'}`)
  lines.push(`REDIRECTS ${chain.hopsHidden ? 'hidden by runtime' : chain.redirectCount}`)
  if (chain.loop) lines.push(`REDIRECT LOOP: ${chain.loopUrl} appears twice in the chain - the chain never resolves.`)
  if (chain.capped) lines.push(`HOP CAP HIT: stopped after ${chain.maxHops} redirects; the chain continues beyond ${chain.finalUrl}.`)
  if (chain.httpDowngrade) lines.push('HTTPS->HTTP DOWNGRADE: a redirect target uses insecure http://.')
  if (chain.note) lines.push(`NOTE: ${chain.note}`)
  return lines.join('\n')
}

/**
 * Consistent details payload for every redirect-aware rule: the full
 * `redirectChainText` block is the single rendered form of the chain. The
 * structured RedirectChain stays an internal shape - emitting it here too
 * would render the same chain twice on one card.
 */
export const redirectChainDetails = (chain: RedirectChain | null | undefined): Record<string, unknown> =>
  chain ? { redirectChainText: formatRedirectChain(chain) } : {}
