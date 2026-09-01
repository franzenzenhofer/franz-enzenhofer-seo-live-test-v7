import { discardBody } from './http-utils'
import { chainFailure } from './redirectChain.steps'
import { chainFromObservedHops } from './redirectChain.fromHops'
import type { FollowResult, ObservedHops, RedirectChain, RedirectHopObserver } from './redirectChainTypes'

const OBSERVER_EMPTY_NOTE =
  'The request redirected but no per-hop data was observable (webRequest captured no events for this probe), '
  + 'so intermediate statuses and Location targets are unavailable. Only the final response is shown.'

type Bounds = { maxHops: number; timeoutMs: number; fetchFn: typeof fetch; wantBody?: boolean }

const stopSafely = async (observer: RedirectHopObserver, id: string): Promise<ObservedHops> => {
  try {
    return await observer.stop(id)
  } catch {
    return { hops: [], done: false }
  }
}

const settle = (chain: RedirectChain, res: Response | undefined, wantBody?: boolean): FollowResult => {
  if (chain.loop || chain.capped || !res) {
    if (res) discardBody(res)
    return { chain }
  }
  if (wantBody) return { chain, response: res }
  discardBody(res)
  return { chain }
}

/**
 * Extension path: the runtime observer (chrome.webRequest, in the service
 * worker) records every real hop while one redirect:'follow' fetch walks the
 * chain, so per-hop statuses and Location targets stay observable despite
 * MV3's opaqueredirect. Returns null when observation cannot start - the
 * caller then falls back to the manual fetch walk (degrading loudly there).
 */
export const followViaObserver = async (
  startUrl: string, bounds: Bounds, observer: RedirectHopObserver,
): Promise<FollowResult | null> => {
  let id: string
  try {
    id = await observer.start(startUrl)
  } catch {
    return null
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), bounds.timeoutMs)
  // Call as a free function - a member call would rebind `this` and make the
  // browser's fetch throw "Illegal invocation".
  const { fetchFn } = bounds
  let res: Response | undefined
  let fetchError: unknown
  try {
    res = await fetchFn(startUrl, { redirect: 'follow', signal: controller.signal })
  } catch (error) {
    fetchError = error
  } finally {
    clearTimeout(timer)
  }
  const observed = await stopSafely(observer, id)
  if (observed.hops.length) {
    const final = res ? { url: res.url || startUrl, status: res.status } : undefined
    const chain = chainFromObservedHops(startUrl, observed.hops, bounds.maxHops, final)
    // A loop or cap explains the failed follow fetch (ERR_TOO_MANY_REDIRECTS).
    if (chain.loop || chain.capped) return settle(chain, res, bounds.wantBody)
    if (fetchError) throw chainFailure(fetchError, controller.signal.aborted, startUrl, bounds.timeoutMs, chain.hops)
    return settle(chain, res, bounds.wantBody)
  }
  if (fetchError || !res) throw chainFailure(fetchError, controller.signal.aborted, startUrl, bounds.timeoutMs, [])
  const chain = chainFromObservedHops(startUrl, [], bounds.maxHops, { url: res.url || startUrl, status: res.status })
  if (res.redirected) {
    chain.redirected = true
    chain.hopsHidden = true
    chain.note = OBSERVER_EMPTY_NOTE
  }
  return settle(chain, res, bounds.wantBody)
}
