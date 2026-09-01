import { newChain } from './redirectChain.steps'
import type { RedirectChain, RedirectHop } from './redirectChainTypes'

type FinalResponse = { url: string; status: number }

/**
 * Applies the exact loop/cap/downgrade semantics of the fetch walk to hops
 * observed by a runtime observer (chrome.webRequest). A hop with `location`
 * is a redirect; one without is the final response. When the observer saw no
 * terminal event, `final` (from the follow fetch) closes the chain.
 */
export const chainFromObservedHops = (
  startUrl: string, observed: readonly RedirectHop[], maxHops: number, final?: FinalResponse,
): RedirectChain => {
  const chain = newChain(startUrl, maxHops)
  const seen = new Set<string>([startUrl])
  for (const hop of observed) {
    if (!hop.location) {
      chain.hops.push({ url: hop.url, status: hop.status })
      chain.finalUrl = hop.url
      chain.finalStatus = hop.status
      return chain
    }
    chain.hops.push({ url: hop.url, status: hop.status, location: hop.location })
    chain.redirectCount += 1
    chain.redirected = true
    chain.finalUrl = hop.location
    chain.finalStatus = hop.status
    if (hop.url.startsWith('https:') && hop.location.startsWith('http:')) chain.httpDowngrade = true
    if (seen.has(hop.location)) {
      chain.loop = true
      chain.loopUrl = hop.location
      return chain
    }
    seen.add(hop.location)
    if (chain.redirectCount >= maxHops) {
      chain.capped = true
      return chain
    }
  }
  if (final) {
    chain.hops.push({ url: final.url, status: final.status })
    chain.finalUrl = final.url
    chain.finalStatus = final.status
  }
  return chain
}
