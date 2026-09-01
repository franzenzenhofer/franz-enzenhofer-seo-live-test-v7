import { discardBody } from './http-utils'
import { isRedirectStatus } from './http-constants'
import { finalize, followHidden, hopFetch, newChain, stopWithNote } from './redirectChain.steps'
import { followViaObserver } from './redirectChain.observed'
import { getRedirectHopObserver } from './redirectChainObserver'
import type { FollowOptions, FollowResult } from './redirectChainTypes'

export const REDIRECT_MAX_HOPS = 10
export const REDIRECT_TIMEOUT_MS = 15_000

/**
 * Follows redirects hop by hop with `redirect: 'manual'`, recording every
 * hop's URL, HTTP status and resolved Location target. Detects loops, caps
 * runaway chains, flags https->http downgrades, and bounds the whole walk
 * with one timeout. Intermediate bodies are always discarded; the final
 * body only survives when `wantBody: true` (caller must consume it).
 */
export const followRedirectChain = async (startUrl: string, opts: FollowOptions = {}): Promise<FollowResult> => {
  const maxHops = opts.maxHops ?? REDIRECT_MAX_HOPS
  const timeoutMs = opts.timeoutMs ?? REDIRECT_TIMEOUT_MS
  const fetchFn = opts.fetchFn ?? fetch
  // In the extension a webRequest-backed observer exposes the real hops that
  // MV3 fetch() hides; Node/CLI never registers one and keeps the walk below.
  const observer = opts.observer === undefined ? getRedirectHopObserver() : opts.observer
  if (observer) {
    const observed = await followViaObserver(startUrl, { maxHops, timeoutMs, fetchFn, wantBody: opts.wantBody }, observer)
    if (observed) return observed
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const chain = newChain(startUrl, maxHops)
  const seen = new Set<string>([startUrl])
  let url = startUrl
  try {
    for (;;) {
      const res = await hopFetch(fetchFn, url, controller.signal, timeoutMs, chain.hops)
      if (res.type === 'opaqueredirect') {
        discardBody(res)
        return await followHidden(chain, url, fetchFn, controller.signal, opts.wantBody)
      }
      if (!isRedirectStatus(res.status)) return finalize(chain, url, res, opts.wantBody)
      const rawLocation = res.headers.get('location')
      discardBody(res)
      chain.finalStatus = res.status
      if (!rawLocation) {
        return stopWithNote(chain, url, res.status,
          `HTTP ${res.status} response without a Location header at ${url} - the redirect cannot be followed.`)
      }
      let next: string
      try {
        next = new URL(rawLocation, url).toString()
      } catch {
        return stopWithNote(chain, url, res.status,
          `HTTP ${res.status} at ${url} has an unparseable Location header: ${rawLocation}`)
      }
      chain.hops.push({ url, status: res.status, location: next })
      chain.redirectCount += 1
      chain.redirected = true
      chain.finalUrl = next
      if (url.startsWith('https:') && next.startsWith('http:')) chain.httpDowngrade = true
      if (seen.has(next)) {
        chain.loop = true
        chain.loopUrl = next
        return { chain }
      }
      seen.add(next)
      if (chain.redirectCount >= maxHops) {
        chain.capped = true
        return { chain }
      }
      url = next
    }
  } finally {
    clearTimeout(timer)
  }
}
